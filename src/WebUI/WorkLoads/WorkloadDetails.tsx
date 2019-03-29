/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1Pod, V1PodTemplateSpec, V1LabelSelector } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { Link } from "azure-devops-ui/Link";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IImageDetails } from "../../Contracts/Types";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { PodsDetails } from "../Pods/PodsDetails";
import { PodsStore } from "../Pods/PodsStore";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils, IMetadataAnnotationPipeline } from "../Utils";
import "./WorkloadDetails.scss";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { KubeSummary } from "../Common/KubeSummary";
import { getRunDetailsText } from "../RunDetails";

export interface IWorkloadDetailsProperties extends IVssComponentProperties {
    parentMetaData: V1ObjectMeta;
    podTemplate: V1PodTemplateSpec;
    selector: V1LabelSelector | undefined;
    parentKind: string;
    statusProps?: IStatusProps;
    statusTooltip?: string;
}

export interface IWorkloadDetailsState {
    pods: Array<V1Pod>;
    selectedPod: V1Pod | null;
    showSelectedPod: boolean;
    showImageDetails: boolean;
    selectedImageDetails: IImageDetails | undefined;
}

export interface IWorkLoadDetailsItem {
    podTemplate: V1PodTemplateSpec;
    parentMetaData: V1ObjectMeta;
    selector: V1LabelSelector | undefined;
}

export class WorkloadDetails extends BaseComponent<IWorkloadDetailsProperties, IWorkloadDetailsState> {
    constructor(props: IWorkloadDetailsProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null,
            showSelectedPod: false,
            showImageDetails: false,
            selectedImageDetails: undefined
        };
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
    }

    public render(): JSX.Element {
        if (this.state.selectedPod && this.state.showSelectedPod) {
            const parentName = this.props.parentMetaData.name || "";
            return (<PodsDetails
                pods={this.state.pods}
                parentName={parentName}
                parentKind={this.props.parentKind}
                selectedPod={this.state.selectedPod}
                onBackButtonClick={this._setSelectedPodStateFalse}
            />);
        }
        else if (this.state.showImageDetails && this.state.selectedImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

        return (
            <Page className="workload-details-page flex flex-grow">
                {this._getMainHeading()}
                <div className="workload-details-page-content page-content page-content-top">
                    {this._getWorkloadDetails()}
                    {this._getAssociatedPods()}
                </div>
            </Page>
        );
    }

    public componentDidMount(): void {
        const podList = this._podsStore.getState().podsList;
        const pods: V1Pod[] = (podList && podList.items || []).filter(pod => {
            return Utils.isOwnerMatched(pod.metadata, this.props.parentMetaData.uid);
        });

        this.setState({
            pods: pods,
            selectedPod: pods && pods.length > 0 ? pods[0] : null
        });
    }

    private _getMainHeading(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        return !metadata ? null
            : <PageTopHeader title={metadata.name} statusProps={this.props.statusProps} statusTooltip={this.props.statusTooltip} />;
    }

    private _setSelectedPodStateFalse = () => {
        this.setState({
            showSelectedPod: false,
            selectedPod: null
        });
    }

    private _showImageDetails = (imageId: string) => {
        const imageService = KubeSummary.getImageService();
        imageService && imageService.getImageDetails(imageId).then(imageDetails => {
            this.setState({
                showImageDetails: true,
                selectedImageDetails: imageDetails
            });
        });
    }

    private _hideImageDetails = () => {
        this.setState({
            showImageDetails: false,
            selectedImageDetails: undefined
        });
    }

    private _getColumns = (): ITableColumn<IWorkLoadDetailsItem>[] => {
        const columns: ITableColumn<IWorkLoadDetailsItem>[] = [
            {
                id: "w-image",
                name: Resources.ImageText,
                width: new ObservableValue(360),
                minWidth: 250,
                renderCell: this._renderImageCell
            },
            {
                id: "w-labels",
                name: Resources.LabelsText,
                width: -50,
                minWidth: 200,
                renderCell: (r, c, col, item) => WorkloadDetails._renderCellWithTags(r, c, col, item, (item) => item.parentMetaData.labels)
            },
            {
                id: "w-selector",
                name: Resources.SelectorText,
                width: -50,
                minWidth: 200,
                renderCell: (r, c, col, item) => WorkloadDetails._renderCellWithTags(r, c, col, item, (item) => (item.selector && item.selector.matchLabels) || {})
            }
        ];

        return columns;
    }

    private _getWorkloadDetails(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const pipelineDetails = Utils.getPipelineDetails(metadata.annotations);
            const tableItems: IWorkLoadDetailsItem[] = [{ podTemplate: this.props.podTemplate, parentMetaData: metadata, selector: this.props.selector }];
            const agoTime = Date_Utils.ago(new Date(metadata.creationTimestamp), Date_Utils.AgoFormat.Compact);

            return (
                <CustomCard className="workload-details-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                    {localeFormat(Resources.WorkloadDetails, this.props.parentKind)}
                                </HeaderTitle>
                            </HeaderTitleRow>
                            <HeaderDescription className={"text-ellipsis"}>
                                {
                                   getRunDetailsText(metadata.annotations, agoTime)
                                }
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className="workload-full-details-table" contentPadding={false}>
                        <Table
                            id="workload-full-details-table"
                            showHeader={true}
                            showLines={false}
                            singleClickActivation={false}
                            itemProvider={new ArrayItemProvider<IWorkLoadDetailsItem>(tableItems)}
                            columns={this._getColumns()}
                        />
                    </CardContent>
                </CustomCard>
            );
        }

        return null;
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.pods.length === 0) {
            return KubeZeroData.getWorkloadAssociatedPodsZeroData();
        }

        return (
            <PodsTable
                contentClassName="workload-pods-table"
                podsToRender={this.state.pods}
                headingText={Resources.PodsText}
                onItemActivated={this._onSelectedPodInvoked}
            />
        );
    }

    private _onSelectedPodInvoked = (event: React.SyntheticEvent<HTMLElement>, pod: V1Pod) => {
        this.setState({
            showSelectedPod: true,
            selectedPod: pod
        });
    }

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IWorkLoadDetailsItem>, tableItem: IWorkLoadDetailsItem): JSX.Element => {
        const imageId = Utils.getImageIdForWorkload(Utils.getFirstContainerName(tableItem.podTemplate.spec), this.state.pods);
        const imageText = Utils.getFirstImageName(tableItem.podTemplate.spec) || "";
        const hasImageDetails: boolean = this._imageDetailsStore.hasImageDetails(imageId);
        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly>
                <Link
                    className="fontSizeM text-ellipsis bolt-table-link"
                    rel={"noopener noreferrer"}
                    excludeTabStop
                    onClick={() => this._showImageDetails(imageId)}
                >
                    {imageText}
                </Link>
            </Tooltip>
            : defaultColumnRenderer(imageText);

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, hasImageDetails ? "bolt-table-cell-content-with-link" : "");
    }

    private static _renderCellWithTags(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<IWorkLoadDetailsItem>,
        tableItem: IWorkLoadDetailsItem,
        getItems: (tableItem: IWorkLoadDetailsItem) => { [key: string]: string }): JSX.Element {
        const itemToRender: React.ReactNode = <Tags items={getItems(tableItem)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _podsStore: PodsStore;
    private _imageDetailsStore: ImageDetailsStore;
}