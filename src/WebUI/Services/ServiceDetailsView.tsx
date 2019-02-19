/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ITableColumn, TableColumnLayout } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
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

const LoadBalancerText: string = "LoadBalancer";

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
            if (item.type === LoadBalancerText) {
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
                renderCell: ServiceDetailsView._renderTextCell
            },
            {
                id: "clusterIp",
                name: "ClusterIP",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderTextCell
            },
            {
                id: "externalIp",
                name: "externalIp",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderTextCell
            },
            {
                id: "port",
                name: "port",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderTextCell
            },
            {
                id: "sessAffinity",
                name: "sessAffinity",
                width: -100,
                className: "s-key",
                minWidth: 80,
                renderCell: ServiceDetailsView._renderTextCell
            },
            {
                id: "selector",
                name: "selector",
                width: -100,
                className: "s-key",
                minWidth: 200,
                renderCell: ServiceDetailsView._renderLabelGroups
            },
            {
                id: "labels",
                name: "labels",
                width: -100,
                className: "s-key",
                minWidth: 200,
                renderCell: ServiceDetailsView._renderLabelGroups
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

    private static _renderTextCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        const itemToRender = BaseKubeTable.renderColumn(ServiceDetailsView._getCellText(tableColumn, rowIndex, service), BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getCellText(tableColumn: ITableColumn<IServiceItem>, rowIndex: number, service:IServiceItem): string {
        let textToRender: string = "";
        switch (tableColumn.id) {
            case "type":
                textToRender = service.type;
                if (rowIndex === 0) {
                    textToRender = Resources.TypeText;
                }
                break;
            case "clusterIp":
                textToRender = service.clusterIP;
                if (rowIndex === 0) {
                    textToRender = Resources.ClusterIPText;
                }
                break;
            case "externalIp":
                textToRender = service.externalIP;
                if (rowIndex === 0) {
                    textToRender = Resources.ExternalIPText;
                }
                break;
            case "port":
                textToRender = service.port;
                if (rowIndex === 0) {
                    textToRender = Resources.PortText;
                }
                break;
            case "sessAffinity":
                textToRender = service.service ? service.service.spec.sessionAffinity : "";
                if (rowIndex === 0) {
                    textToRender = Resources.SessionAffinityText;
                }
                break;
        };

        return textToRender;
    }

    private static _renderLabelGroups(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        let labelsArray: { [key: string]: string } = {};
        let title: string = "";

        switch (tableColumn.id) {
            case "selector":
                labelsArray = service.service ? service.service.spec.selector : {};
                title = Resources.SelectorText;
                break;
            case "labels":
                labelsArray = service.service ? service.service.metadata.labels : {};
                title = Resources.LabelsText;
                break;
        };

        let itemToRender: React.ReactNode = (
            <LabelGroup
                className="s-details-label"
                labelProps={Utils.getUILabelModelArray(labelsArray)}
                fadeOutOverflow={true}
                wrappingBehavior={WrappingBehavior.oneLine}
            />
        );
        if (rowIndex === 0) {
            itemToRender = BaseKubeTable.renderColumn(title, BaseKubeTable.defaultColumnRenderer);
        }
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

}