/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1Pod, V1PodTemplateSpec } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodsDetails } from "../Pods/PodsDetails";
import { PodsStore } from "../Pods/PodsStore";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";

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
}

export class WorkloadDetails extends BaseComponent<IWorkloadDetailsProperties, IWorkloadDetailsState> {
    constructor(props: IWorkloadDetailsProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null,
            showSelectedPod: false
        };
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);
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
        return metadata ? <PageTopHeader title={metadata.name} statusProps={this.props.statusProps} /> : null;
    }

    private _setSelectedPodStateFalse = () => {
        this.setState({
            showSelectedPod: false,
            selectedPod: null
        });
    }

    private static _getColumns(): ITableColumn<any>[] {
        const columns: ITableColumn<any>[] = [
            {
                id: "w-image",
                name: Resources.ImageText,
                width: new ObservableValue(360),
                minWidth: 250,
                renderCell: WorkloadDetails._renderImageCell
            },
            {
                id: "w-labels",
                name: Resources.LabelsText,
                width: -100,
                minWidth: 200,
                renderCell: WorkloadDetails._renderLabelsCell
            }
        ];

        return columns;
    }

    private _getWorkloadDetails(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const pipeline = Utils.getPipelineText(metadata.annotations);
            const tableItems = [{ podTemplate: this.props.podTemplate, parentMetaData: metadata }];
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
                                    pipeline
                                        ? localeFormat(Resources.ServiceCreatedWithPipelineText, agoTime, pipeline)
                                        : localeFormat(Resources.CreatedAgo, agoTime)
                                }
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent contentPadding={false}>
                        <Table
                            id="workload-full-details-table"
                            showHeader={true}
                            showLines={false}
                            singleClickActivation={false}
                            itemProvider={new ArrayItemProvider<any>(tableItems)}
                            columns={WorkloadDetails._getColumns()}
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

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, tableItem: any): JSX.Element {
        const { imageText, imageTooltipText } = Utils.getImageText(tableItem.podTemplate.spec);
        const itemToRender = defaultColumnRenderer(imageText, undefined, imageTooltipText);
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLabelsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, tableItem: any): JSX.Element {
        const itemToRender: React.ReactNode = <Tags items={tableItem.parentMetaData.labels} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _podsStore: PodsStore;
}