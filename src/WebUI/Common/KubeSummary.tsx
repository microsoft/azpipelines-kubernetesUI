/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList, V1DaemonSetList, V1StatefulSetList, V1Service, V1PodList, V1Pod, V1DaemonSet, V1StatefulSet, V1PodTemplateSpec, V1ObjectMeta } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IVssComponentProperties, IServiceItem, IDeploymentReplicaSetItem } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsTable } from "../Workloads/DeploymentsTable";
import "./KubeSummary.scss";
import { WorkloadPodsView } from "../Workloads/WorkloadPodsView";
import { ServiceDetailsView } from "../Services/ServiceDetailsView";
import { ServicesTable } from "../Services/ServicesTable";
// todo :: work around till this issue is fixed in devops ui
import "azure-devops-ui/Label.scss";
import { DaemonSetTable } from "../Workloads/DaemonSetTable";
import { StatefulSetTable } from "../Workloads/StatefulSetTable";
import { PodsTable } from "../Pods/PodsTable";
import { KubeZeroData } from "./KubeZeroData";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { KubeFilterBar, NameKey, TypeKey } from "./KubeFilterBar";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { SelectedItemKeys } from "../Constants";
import { PodDetailsView } from "../Pods/PodDetailsView";
import { SelectionStore } from "../Selection/SelectionStore";
import { StoreManager } from "../FluxCommon/StoreManager";
import { WorkloadsActionsCreator } from "../Workloads/WorkloadsActionsCreator";
import { WorkloadsPivot } from "../Workloads/WorkloadsPivot";
import { WorkloadsStore } from "../Workloads/WorkloadsStore";
import { ServicesStore } from "../Services/ServicesStore";
import { ServicesPivot } from "../Services/ServicesPivot";
import { PodsStore } from "../Pods/PodsStore";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { WorkloadsEvents } from "../Constants";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const filterToggled = new ObservableValue<boolean>(false);

//todo: refactor filter properties to respective resource type components
export interface IKubernetesContainerState {
    namespace?: string;
    selectedPivotKey?: string;
    selectedItem?: V1ReplicaSet | V1DaemonSet | V1StatefulSet | V1Pod | IServiceItem;
    showSelectedItem?: boolean;
    resourceSize: number;
    workloadsFilter: Filter;
    svcFilter: Filter;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});

        const workloadsFilter = new Filter();
        const servicesFilter = new Filter();
        workloadsFilter.subscribe(this._onWorkloadsFilterApplied, FILTER_CHANGE_EVENT);
        servicesFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);

        // Take namespace from deployment store and rest from selection store
        this.state = {
            namespace: this.props.namespace || "",
            selectedPivotKey: workloadsPivotItemKey,
            showSelectedItem: false,
            selectedItem: undefined,
            resourceSize: 0,
            svcFilter: servicesFilter,
            workloadsFilter: workloadsFilter
        };

        this._servicesStore = StoreManager.GetStore<ServicesStore>(ServicesStore);
        this._selectionStore = StoreManager.GetStore<SelectionStore>(SelectionStore);
        this._selectionStore.addChangedListener(this._onSelectionStoreChanged);

        this._workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);

        // Ensure workload store is created before get Deployments action
        this._workloadsStore = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        // Fetch deployments in parent component we need to show nameSpace in heading and namespace is obtained from deployment metadata
        this._workloadsActionCreator.getDeployments(this.props.kubeService);
        this._workloadsStore.addListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
    }

    public render(): React.ReactNode {
        return (
            <div className={"kubernetes-container"}>
                {
                    this.state.showSelectedItem ?
                        this._getSelectedItemPodsView() :
                        this._getMainContent()
                }
            </div >
        );
    }

    public componentWillUnmount(): void {
        this._selectionStore.removeChangedListener(this._onSelectionStoreChanged);
        this._workloadsStore.removeListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
    }

    private _setNamespaceOnDeploymentsFetched = (): void => {
        if (!this.state.namespace) {
            const workloadStoreState = this._workloadsStore.getState();
            this.setState({ namespace: workloadStoreState.deploymentNamespace });
        }
    }

    private _onWorkloadsFilterApplied = (currentState: IFilterState) => {
        this.setState({})
    };

    private _onSvcFilterApplied = (currentState: IFilterState) => {
        this.setState({})
    };

    private _onZeroDataFound = (): void => {
        const workloadSize = this._workloadsStore.getWorkloadSize();
        const servicesSize = this._servicesStore.getServicesSize();
        this.setState({ resourceSize: workloadSize + servicesSize });
    }

    private _getMainContent(): JSX.Element {
        return (
            <div className="main-content">
                {this._getMainHeading()}
                {this.state.resourceSize > 0 ?
                    this._getMainPivot() :
                    KubeZeroData._getDefaultZeroData("https://kubernetes.io/docs/concepts/workloads/pods/pod/",
                        Resources.LearnMoreText, Resources.NoWorkLoadsText, Resources.CreateWorkLoadText)
                }
            </div>
        );
    }

    private _getMainHeading(): JSX.Element {
        return (
            <div className="content-main-heading">
                <h2 className="title-heading">{this.props.title}</h2>
                <div className={"sub-heading"}>{format(Resources.NamespaceHeadingText, this.state.namespace || "")}</div>
            </div>
        );
    }

    private _getMainPivot(): JSX.Element {
        return (
            <div className="content-with-pivot">
                <TabBar
                    onSelectedTabChanged={(key: string) => { this.setState({ selectedPivotKey: key }) }}
                    orientation={0}
                    selectedTabId={this.state.selectedPivotKey || workloadsPivotItemKey}
                    renderAdditionalContent={() => {
                        return (<HeaderCommandBarWithFilter filter={this.state.selectedPivotKey === workloadsPivotItemKey ?
                            this.state.workloadsFilter : this.state.svcFilter}
                            filterToggled={filterToggled} items={[]} />);
                    }}>
                    <Tab name={Resources.PivotWorkloadsText} id={workloadsPivotItemKey} />
                    <Tab name={Resources.PivotServiceText} id={servicesPivotItemKey} />
                </TabBar>
                <TabContent>
                    <div className="item-padding">
                        {this.state.selectedPivotKey === servicesPivotItemKey && <ServicesPivot kubeService={this.props.kubeService} namespace={this.state.namespace} filter={this.state.svcFilter} />}
                        {this.state.selectedPivotKey === workloadsPivotItemKey && <WorkloadsPivot kubeService={this.props.kubeService} namespace={this.state.namespace} filter={this.state.workloadsFilter} />}
                    </div>

                </TabContent>
            </div>
        );
    }

    private _getSelectedItemPodsView(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        if (selectedItem) {
            if (selectedItem instanceof V1DaemonSet || selectedItem instanceof V1StatefulSet || selectedItem instanceof V1ReplicaSet) {
                return this._getWorkoadPodsViewComponent(selectedItem.metadata, selectedItem.spec && selectedItem.spec.template, selectedItem.kind);
            }
            else if (selectedItem instanceof V1Pod) {
                return <PodDetailsView pod={selectedItem} />;
            }
            else {
                return <ServiceDetailsView service={selectedItem} />;
            }
        }

        return null;
    }

    private _getWorkoadPodsViewComponent(parentMetaData: V1ObjectMeta, podTemplate: V1PodTemplateSpec, parentKind: string): JSX.Element | null {
        return (<WorkloadPodsView
            parentMetaData={parentMetaData}
            podTemplate={podTemplate}
            parentKind={parentKind} />);
    }

    private _onSelectionStoreChanged = () => {
        const selectionStoreState = this._selectionStore.getState();
        this.setState({
            showSelectedItem: selectionStoreState.showSelectedItem,
            selectedItem: selectionStoreState.selectedItem
        });
    }

    private _selectionStore: SelectionStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _workloadsStore: WorkloadsStore;
    private _servicesStore: ServicesStore;
}