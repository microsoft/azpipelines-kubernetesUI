/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ITableColumn } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "../Services/ServiceDetails.scss";
import { PodsTable } from "../Pods/PodsTable";
import { PodsDetails } from "../Pods/PodsDetails";
import { ResourceStatus } from "../Common/ResourceStatus";
import { StoreManager } from "../FluxCommon/StoreManager";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IStatusProps, StatusSize } from "azure-devops-ui/Status";
import { V1Pod, V1ObjectMeta, V1PodTemplateSpec } from "@kubernetes/client-node";
import "./WorkloadDetails.scss";
import "../Common/Webplatform.scss";
import { PodsStore } from "../Pods/PodsStore";
import { KubeZeroData, IKubeZeroDataProps } from "../Common/KubeZeroData";
import { HyperLinks } from "../Constants";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { KubeFactory } from "../KubeFactory";
import { KubeImage } from "../../Contracts/Contracts";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { IImageDetails } from "../../Contracts/Types";
import { Link } from "azure-devops-ui/Link";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export interface IWorkloadDetailsProperties extends IVssComponentProperties {
    parentMetaData: V1ObjectMeta;
    podTemplate: V1PodTemplateSpec;
    parentKind: string;
    statusProps?: IStatusProps;
}

export interface IWorkloadDetailsState {
    pods: Array<V1Pod>;
    selectedPod: V1Pod | null;
    showSelectedPod: boolean;
    showImageDetails: boolean;
    selectedImageDetails: IImageDetails | undefined;
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
                onBackButtonClick={this._setSelectedPodStateFalse}
            />);
        }
        else if (this.state.showImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

        return (
            <div className="workload-details-content">
                {this._getMainHeading()}
                {this._getWorkloadDetails()}
                {this._getAssociatedPods()}
            </div>
        );
    }

    public componentDidMount(): void {
        const podList = this._podsStore.getState().podsList;
        let pods: V1Pod[] = (podList && podList.items || []).filter(pod => {
            return Utils.isOwnerMatched(pod.metadata, this.props.parentMetaData.uid);
        });

        this.setState({
            pods: pods,
            selectedPod: pods && pods.length > 0 ? pods[0] : null
        });
    }

    private _getMainHeading(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const headerItem: React.ReactNode = (
                <Header
                    title={metadata.name}
                    titleSize={TitleSize.Large}
                    className={"w-details-heading"}
                />);

            return (
                <div className="content-main-heading">
                    <ResourceStatus statusProps={this.props.statusProps} customDescription={headerItem} statusSize={StatusSize.l} className={"w-details-status-header"} />
                </div>
            );
        }

        return null;
    }

    private _setSelectedPodStateFalse = () => {
        this.setState({
            showSelectedPod: false,
            selectedPod: null
        });
    }

    private _showImageDetails = (imageId: string) => {
        const imageDetails = this._imageDetailsStore.getImageDetails(imageId);
        this.setState({
            showImageDetails: true,
            selectedImageDetails: imageDetails
        });
    }

    private _hideImageDetails = () => {
        this.setState({
            showImageDetails: false,
            selectedImageDetails: undefined
        });
    }

    private _getColumns = (): ITableColumn<any>[] => {
        const columns: ITableColumn<any>[] = [
            {
                id: "w-image",
                name: Resources.ImageText,
                width: new ObservableValue(360),
                className: "workload-details-card",
                minWidth: 250,
                headerClassName: "workload-details-column-header",
                renderCell: this._renderImageCell
            },
            {
                id: "w-labels",
                name: Resources.LabelsText,
                width: -100,
                className: "workload-details-card",
                minWidth: 200,
                headerClassName: "workload-details-column-header",
                renderCell: this._renderLabelsCell
            }
        ];
        return columns;
    }

    private _getWorkloadDetails(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const pipeline = Utils.getPipelineText(metadata.annotations);
            const tableItems = [{}, { podTemplate: this.props.podTemplate, parentMetaData: metadata }];
            const agoTime = Date_Utils.ago(new Date(metadata.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (<BaseKubeTable
                className={"w-details"}
                headingText={localeFormat(Resources.WorkloadDetails, this.props.parentKind)}
                headingDescription={pipeline ? localeFormat(Resources.ServiceCreatedText, agoTime, pipeline) :
                    localeFormat(Resources.CreatedAgo, agoTime)}
                items={tableItems}
                columns={this._getColumns()}
                hideHeaders
                hideLines
            />
            );
        }

        return null;
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.pods.length === 0) {
            const zeroDataProps: IKubeZeroDataProps = {
                imagePath: KubeFactory.getImageLocation(KubeImage.zeroWorkloads),
                hyperLink: HyperLinks.LinkToPodsUsingLabelsLink,
                hyperLinkLabel: Resources.LearnMoreText,
                descriptionText: Resources.NoPodsFoundText
            }
            return KubeZeroData.getDefaultZeroData(zeroDataProps);
        }

        return (
            <PodsTable
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

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, tableItem: any): JSX.Element => {
        let itemToRender: React.ReactNode;
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.defaultColumnRenderer(Resources.ImageText, "w-details-cell-header");
        }
        else {
            const podslist = this._podsStore.getState().podsList;
            const pods: V1Pod[] = podslist && podslist.items || [];
            const imageId = Utils.getImageId(Utils.getFirstImageName(tableItem.podTemplate.spec), tableItem.podTemplate.metadata, pods);
            const imageName: string = Utils.getImageText(tableItem.podTemplate.spec);
            // Todo :: HardCoding hasImageDetails true for the time being, Should change it once we integrate with ImageService
            // ToDo :: Revisit link paddings
            //const hasImageDetails: boolean = this._imageDetailsStore.hasImageDetails(imageName);
            const hasImageDetails = true;
            return (<div className="bolt-table-two-line-cell-item flex-row scroll-hidden">
                <Tooltip text={imageName} overflowOnly>
                    <Link
                        className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link bolt-link w-details-cell-value"
                        onClick={() => hasImageDetails && this._showImageDetails(imageId)}>
                        {imageName || ""}
                    </Link>
                </Tooltip>
            </div>);
            itemToRender =
                <Tooltip text={imageName} overflowOnly>
                    <Link
                        className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link bolt-link w-details-cell-value"
                        onClick={() => hasImageDetails && this._showImageDetails(imageId)}>
                        {imageName || ""}
                    </Link>
                </Tooltip>;
        }

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _renderLabelsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, tableItem: any): JSX.Element {
        let itemToRender: React.ReactNode;
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.defaultColumnRenderer(Resources.LabelsText, "w-details-cell-header");
        }
        else {
            itemToRender = (
                <LabelGroup
                    className="w-details-cell-value"
                    labelProps={Utils.getUILabelModelArray(tableItem.parentMetaData.labels || {})}
                    wrappingBehavior={WrappingBehavior.freeFlow}
                    fadeOutOverflow={true}
                />);
        }

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _podsStore: PodsStore;
    private _imageDetailsStore: ImageDetailsStore;
}