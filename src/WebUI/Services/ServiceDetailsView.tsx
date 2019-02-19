/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceDetailsView.scss";
import { V1Pod } from "@kubernetes/client-node";
import { PodsTable } from "../Pods/PodsTable";
import { PodDetailsView } from "../Pods/PodDetailsView";
import { KubeZeroData } from "../Common/KubeZeroData";
import { ResourceStatus } from "../Common/ResourceStatus";
import { IKubeService } from "../../Contracts/Contracts";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { SelectionStore } from "../Selection/SelectionStore";
import { SelectionActions } from "../Selection/SelectionActions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { ServicesEvents } from "../Constants";
import { ServicesStore } from "./ServicesStore";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IStatusProps, Statuses, StatusSize } from "azure-devops-ui/Status";

export interface IServiceDetailsViewProperties extends IVssComponentProperties {
    kubeService: IKubeService;
    service: IServiceItem;
}

export interface IServiceDetailsViewState {
    pods: Array<V1Pod>;
    selectedPod: V1Pod | null;
    showSelectedPod: boolean;
}

export class ServiceDetailsView extends BaseComponent<IServiceDetailsViewProperties, IServiceDetailsViewState> {
    constructor(props: IServiceDetailsViewProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null,
            showSelectedPod: false
        };
        this._servicesStore = StoreManager.GetStore<ServicesStore>(ServicesStore);
        this._podsActionsCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);

        const svc = this.props.service && this.props.service.service;
        //service currently only supports equals with "and" operator. The generator generates that condition.
        const labelSelector: string = Utils.generateEqualsConditionLabelSelector(svc && svc.spec && svc.spec.selector || {});
        this._podsActionsCreator.getPods(this.props.kubeService, labelSelector);
        this._servicesStore.addListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    public render(): JSX.Element {
        if (this.state.selectedPod && this.state.showSelectedPod) {
            return (<PodDetailsView
                pod={this.state.selectedPod}
            />);
        }

        return (
            <div className="service-main-content">
                {this._getMainHeading()}
                {this._getServiceDetails()}
                {this._getAssociatedPods()}
            </div>
        );
    }

    public componentWillUnmount(): void {
        this._servicesStore.removeListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    private _getMainHeading(): JSX.Element | null {
        const item = this.props.service;
        if (item) {
            let statusProps: IStatusProps = Statuses.Success;
            if (item.type === "LoadBalancer") {
                if (!item.externalIP) {
                    statusProps = Statuses.Running;
                }
            }
            const headerItem: React.ReactNode = (<h2 className="title-heading">{item.package}</h2>);
            return (
                <div className="content-main-heading">
                    <ResourceStatus statusProps={statusProps} customDescription={headerItem} statusSize={StatusSize.l} />
                </div>
            );
        }

        return null;
    }

    private static _getColumns(): ITableColumn<IServiceItem>[] {
        const columns: ITableColumn<any>[] = [
            {
                id: "type",
                name: "type",
                width: -100,
                className: "s-key",
                minWidth: 80,   
                renderCell: ServiceDetailsView._renderTypeCell
            },
            {
                id: "clusterIp",
                name: "ClusterIP",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderClusterIPCell
            },
            {
                id: "externalIp",
                name: "externalIp",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderExternalIPCell
            },
            {
                id: "port",
                name: "port",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderPortCell
            },
            {
                id: "sessAffinity",
                name: "sessAffinity",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderSessionAffinityCell
            },
            {
                id: "selector",
                name: "selector",
                width: -100,
                className: "s-key",
                minWidth: 200,
                renderCell: ServiceDetailsView._renderSelctorCell
            },
            {
                id: "labels",
                name: "labels",
                width: -100,
                className: "s-key",
                minWidth: 200,
                renderCell: ServiceDetailsView._renderLabelsCell
            }
        ];
        return columns;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const tableItems: IServiceItem[] = [{ package: '', type:'', clusterIP:'', externalIP:'', port:'', creationTimestamp: new Date(), uid:'', pipeline:''}, item];
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (
                <BaseKubeTable
                    className={"s-details"}
                    headingText={Resources.ServiceDetails}
                    headingDescription={
                        item.pipeline ? localeFormat(Resources.ServiceCreatedText, agoTime, item.pipeline) :
                            localeFormat(Resources.CreatedAgo, agoTime)}
                    items={tableItems}
                    columns={ServiceDetailsView._getColumns()}
                    hideHeaders
                    hideLines
                />
            );
        }

        return null;
    }

    private _onPodsFetched = (): void => {
        const pods = this._servicesStore.getState().podsList;
        this.setState({
            pods: pods || []
        });
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.pods.length === 0) {
            return KubeZeroData._getDefaultZeroData("https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/",
                Resources.LearnMoreText, Resources.NoPodsForSvcText,
                Resources.LinkSvcToPodsText, Resources.AssociatedPodsText);
        }
        return (
            <PodsTable
                podsToRender={this.state.pods}
                headingText={Resources.AssociatedPodsText}
                onItemActivated={this._onSelectedPodInvoked}
                showWorkloads={true}
            />
        );
    }

    private _onSelectedPodInvoked = (event: React.SyntheticEvent<HTMLElement>, pod: V1Pod) => {
        this.setState({
            showSelectedPod: true,
            selectedPod: pod
        });
    }

    private _servicesStore: ServicesStore;
    private _podsActionsCreator: PodsActionsCreator

    private static _renderTypeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let text: string = service.type;
        if (rowIndex == 0) {
            text = Resources.TypeText;
        }
        const itemToRender = BaseKubeTable.renderColumn(text || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderClusterIPCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let text: string = service.clusterIP;
        if (rowIndex == 0) {
            text = Resources.ClusterIPText;
        }
        const itemToRender = BaseKubeTable.renderColumn(text || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderExternalIPCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let text: string = service.externalIP;
        if (rowIndex == 0) {
            text = Resources.ExternalIPText;
        }
        const itemToRender = BaseKubeTable.renderColumn(text || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderPortCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let text: string = service.port;
        if (rowIndex == 0) {
            text = Resources.PortText;
        }
        const itemToRender = BaseKubeTable.renderColumn(text || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderSessionAffinityCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, item: IServiceItem): JSX.Element {
        let text: string = item.service ? item.service.spec.sessionAffinity : "";
        if (rowIndex == 0) {
            text = Resources.SessionAffinityText;
        }
        const itemToRender = BaseKubeTable.renderColumn(text || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderSelctorCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let itemToRender: React.ReactNode = (
            <LabelGroup
                className="s-details-label"
                labelProps={Utils.getUILabelModelArray(service.service ? service.service.spec.selector : {})}
                fadeOutOverflow={true}
                wrappingBehavior={WrappingBehavior.oneLine}
            />
        );
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.renderColumn(Resources.SelectorText, BaseKubeTable.defaultColumnRenderer);
        }
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    private static _renderLabelsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let itemToRender: React.ReactNode = (
            <LabelGroup
                className="s-details-label"
                labelProps={Utils.getUILabelModelArray(service.service ? service.service.metadata.labels : {})}
                fadeOutOverflow={true}
                wrappingBehavior={WrappingBehavior.oneLine}
            />
        );
        if (rowIndex == 0) {
            itemToRender = BaseKubeTable.renderColumn(Resources.LabelsText, BaseKubeTable.defaultColumnRenderer);
        }
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

}