/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat, format } from "azure-devops-ui/Core/Util/String";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ITableColumn, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
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
import { IStatusProps, Statuses, StatusSize } from "azure-devops-ui/Status";
import { V1Pod, V1ObjectMeta, V1PodTemplateSpec } from "@kubernetes/client-node";
import "./WorkloadDetails.scss";
import { PodsStore } from "../Pods/PodsStore";
import { KubeZeroData } from "../Common/KubeZeroData";

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
            />);
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
            selectedPod: pods[0]
        });
    }

    private _getMainHeading(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const headerItem: React.ReactNode = (<h2 className="title-heading">{metadata.name}</h2>);
            return (
                <div className="content-main-heading">
                    <ResourceStatus statusProps={this.props.statusProps} customDescription={headerItem} statusSize={StatusSize.l} />
                </div>
            );
        }

        return null;
    }

    private static _getColumns(): ITableColumn<any>[] {
        const columns: ITableColumn<any>[] = [
            {
                id: "w-image",
                name: Resources.ImageText,
                width: new ObservableValue(360),
                className: "w-key",
                minWidth: 250,
                headerClassName: "workload-details-column-header",
                renderCell: WorkloadDetails._renderImageCell
            },
            {
                id: "w-labels",
                name: Resources.LabelsText,
                width: -100,
                className: "w-key",
                minWidth: 200,
                headerClassName: "workload-details-column-header",
                renderCell: WorkloadDetails._renderLabelsCell
            }
        ];
        return columns;
    }

    private _getWorkloadDetails(): JSX.Element | null {
        const metadata = this.props.parentMetaData;
        if (metadata) {
            const pipeline = Utils.getPipelineText(metadata.annotations);
            const tableItems = new ArrayItemProvider<any>([{}, { podTemplate: this.props.podTemplate, parentMetaData: metadata }]);
            const agoTime = Date_Utils.ago(new Date(metadata.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (
                <div className="kube-list-content s-details depth-16">
                    <div className="workload-details-primary-text">{localeFormat(Resources.WorkloadDetails, this.props.parentKind)}</div>
                    <div className="workload-details-secondary-text">
                        {pipeline ? localeFormat(Resources.ServiceCreatedText, agoTime, pipeline) :
                            localeFormat(Resources.CreatedAgo, agoTime)}
                    </div>
                    <Table
                        className="w-details"
                        id={format("workload-details-tbl-{0}", metadata.uid)}
                        showLines={false}
                        showHeader={false}
                        singleClickActivation={false}
                        itemProvider={tableItems}
                        pageSize={tableItems.getCount()}
                        columns={WorkloadDetails._getColumns()}
                    />
                </div>
            );
        }

        return null;
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.pods.length === 0) {
            return KubeZeroData._getDefaultZeroData("https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/",
                Resources.LearnMoreText, Resources.NoPodsFoundText,
                Resources.LinkSvcToPodsText, Resources.PodsText);
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
        let itemToRender: React.ReactNode;
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.defaultColumnRenderer(Resources.ImageText, "w-details-cell-header");
        }
        else {
            itemToRender = <div className="kube-simple-cell">
                {Utils.getPodImageName(tableItem.podTemplate)}
            </div>;
        }

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLabelsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, tableItem: any): JSX.Element {
        let itemToRender: React.ReactNode;
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.defaultColumnRenderer(Resources.LabelsText, "w-details-cell-header");
        }
        else {
            itemToRender = (
                <LabelGroup
                    labelProps={Utils.getUILabelModelArray(tableItem.parentMetaData.labels || {})}
                    wrappingBehavior={WrappingBehavior.FreeFlow}
                    fadeOutOverflow={true}
                />);
        }

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _podsStore: PodsStore;
}