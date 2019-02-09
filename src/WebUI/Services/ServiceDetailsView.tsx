/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat, format } from "azure-devops-ui/Core/Util/String";
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
import { V1PodList, V1Pod } from "@kubernetes/client-node";
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
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (
                <div className="content-main-heading">
                    <h2 className="title-heading">{item.package}</h2>
                    <div className="sub-heading">
                        {localeFormat(Resources.ServiceCreatedText, agoTime)}
                    </div>
                </div>
            );
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const columns: ITableColumn<any>[] = [
                {
                    id: "key",
                    name: "key",
                    width: new ObservableValue(200),
                    className: "s-key",
                    minWidth: 180,
                    renderCell: renderSimpleCell
                },
                {
                    id: "value",
                    name: "value",
                    width: new ObservableValue(500),
                    className: "s-value",
                    minWidth: 400,
                    renderCell: ServiceDetailsView._renderValueCell
                },
                ColumnFill
            ];
            const tableItems = new ArrayItemProvider<any>([
                { key: Resources.LabelsText, value: item.service.metadata.labels || {} },
                { key: Resources.SelectorText, value: item.service.spec.selector || {} },
                { key: Resources.TypeText, value: item.type },
                { key: Resources.ClusterIPText, value: item.clusterIP },
                { key: Resources.ExternalIPText, value: item.externalIP },
                { key: Resources.PortText, value: item.port },
                { key: Resources.SessionAffinityText, value: item.service.spec.sessionAffinity || "" }
            ]);

            return (
                <div className="kube-list-content s-details depth-16">
                    <h3 className="s-de-heading">{Resources.DetailsText}</h3>
                    <Table
                        className="s-full-details"
                        id={format("s-full-details-{0}", item.uid)}
                        showHeader={false}
                        showLines={true}
                        singleClickActivation={false}
                        itemProvider={tableItems}
                        pageSize={tableItems.getCount()}
                        columns={columns}
                    />
                </div>
            );
        }

        return null;
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        switch (key) {
            case Resources.LabelsText:
            case Resources.SelectorText:
                const props = {
                    columnIndex: columnIndex,
                    children:
                    <LabelGroup
                        labelProps={Utils.getUILabelModelArray(value)}
                        wrappingBehavior={WrappingBehavior.FreeFlow}
                        fadeOutOverflow={true}
                    />,
                    tableColumn: tableColumn
                };

                return renderTableCell(props);

            default:
                return renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem);
        }
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
}