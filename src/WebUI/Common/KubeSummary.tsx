/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ReplicaSet, V1Pod, V1DaemonSet, V1StatefulSet, V1PodTemplateSpec, V1ObjectMeta } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IVssComponentProperties, IServiceItem } from "../Types";
import "./KubeSummary.scss";
import { WorkloadPodsView } from "../Workloads/WorkloadPodsView";
import { ServiceDetailsView } from "../Services/ServiceDetailsView";
import { KubeZeroData } from "./KubeZeroData";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from "azure-devops-ui/HeaderCommandBar";
import { SelectedItemKeys } from "../Constants";
import { PodDetailsView } from "../Pods/PodDetailsView";
import { SelectionStore } from "../Selection/SelectionStore";
import { StoreManager } from "../FluxCommon/StoreManager";
import { WorkloadsActionsCreator } from "../Workloads/WorkloadsActionsCreator";
import { WorkloadsPivot } from "../Workloads/WorkloadsPivot";
import { WorkloadsStore } from "../Workloads/WorkloadsStore";
import { ServicesStore } from "../Services/ServicesStore";
import { ServicesPivot } from "../Services/ServicesPivot";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { WorkloadsEvents, ServicesEvents } from "../Constants";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Page } from "azure-devops-ui/Page"
import { format } from "azure-devops-ui/Core/Util/String";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const workloadsFilterToggled = new ObservableValue<boolean>(false);
const servicesFilterToggled = new ObservableValue<boolean>(false);

//todo: refactor filter properties to respective resource type components
export interface IKubernetesContainerState {
    namespace?: string;
    selectedPivotKey?: string;
    selectedItem?: V1ReplicaSet | V1DaemonSet | V1StatefulSet | V1Pod | IServiceItem;
    showSelectedItem?: boolean;
    selectedItemType?: string;
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

        this._setSelectedKeyPodsViewMap();

        // Take namespace from deployment store and rest from selection store
        this.state = {
            namespace: this.props.namespace || "",
            selectedPivotKey: workloadsPivotItemKey,
            showSelectedItem: false,
            selectedItem: undefined,
            selectedItemType: "",
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

        this._workloadsStore.addListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._servicesStore.addListener(ServicesEvents.ServicesFoundEvent, this._onDataFound);
    }

    public render(): React.ReactNode {
        return (
            <Surface background={SurfaceBackground.neutral}>
                <Page className={"kubernetes-container"}>
                    {
                        this.state.showSelectedItem ?
                            this._getSelectedItemPodsView() :
                            this._getMainContent()
                    }
                </Page>
            </Surface>
        );
    }

    public componentWillUnmount(): void {
        this._selectionStore.removeChangedListener(this._onSelectionStoreChanged);
        this._workloadsStore.removeListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
        this._workloadsStore.removeListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._servicesStore.removeListener(ServicesEvents.ServicesFoundEvent, this._onDataFound);
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

    private _onDataFound = (): void => {
        const workloadSize = this._workloadsStore.getWorkloadSize();
        const servicesSize = this._servicesStore.getServicesSize();
        const resourceSize = workloadSize + servicesSize;
        if (this.state.resourceSize <= 0 && resourceSize > 0) {
            this.setState({ resourceSize: workloadSize + servicesSize });
        }
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
                    onSelectedTabChanged={(key: string) => { this.setState({ selectedPivotKey: key }); }}
                    orientation={0}
                    selectedTabId={this.state.selectedPivotKey || workloadsPivotItemKey}
                    renderAdditionalContent={() => { return this._getFiterHeaderBar(); }}>
                    <Tab name={Resources.PivotWorkloadsText} id={workloadsPivotItemKey} />
                    <Tab name={Resources.PivotServiceText} id={servicesPivotItemKey} />
                </TabBar>
                <TabContent>
                        {this.state.selectedPivotKey === servicesPivotItemKey && <ServicesPivot kubeService={this.props.kubeService} namespace={this.state.namespace} filter={this.state.svcFilter} filterToggled={servicesFilterToggled} />}
                        {this.state.selectedPivotKey === workloadsPivotItemKey && <WorkloadsPivot kubeService={this.props.kubeService} namespace={this.state.namespace} filter={this.state.workloadsFilter} filterToggled={workloadsFilterToggled} />}
                </TabContent>
            </div>
        );
    }

    private _getSelectedItemPodsView(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        const selectedItemType = this.state.selectedItemType;
        if (selectedItem && selectedItemType && this._selectedItemViewMap.hasOwnProperty(selectedItemType)) {
            return this._selectedItemViewMap[selectedItemType](selectedItem);
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
            selectedItem: selectionStoreState.selectedItem,
            selectedItemType: selectionStoreState.selectedItemType
        });
    }

    private _setSelectedKeyPodsViewMap() {
        this._selectedItemViewMap[SelectedItemKeys.StatefulSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "StatefulSet");
        this._selectedItemViewMap[SelectedItemKeys.ServiceItemKey] = (item) => { return <ServiceDetailsView kubeService={this.props.kubeService} service={item} /> };
        this._selectedItemViewMap[SelectedItemKeys.DaemonSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "DaemonSet");
        this._selectedItemViewMap[SelectedItemKeys.OrphanPodKey] = (item) => { return <PodDetailsView pod={item} />; }
        this._selectedItemViewMap[SelectedItemKeys.ReplicaSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "ReplicaSet");
    }

    private _getFiterHeaderBar(): JSX.Element {
        return (
            <div>
                <ConditionalChildren renderChildren={!this.state.selectedPivotKey || this.state.selectedPivotKey === workloadsPivotItemKey}>
                    <HeaderCommandBarWithFilter filter={this.state.workloadsFilter} filterToggled={workloadsFilterToggled} items={[]} />
                </ConditionalChildren>
                <ConditionalChildren renderChildren={this.state.selectedPivotKey === servicesPivotItemKey}>
                    <HeaderCommandBarWithFilter filter={this.state.svcFilter} filterToggled={servicesFilterToggled} items={[]} />
                </ConditionalChildren>
            </div>
        );
    }

    private _selectedItemViewMap: { [selectedItemKey: string]: (selectedItem: any) => JSX.Element | null } = {};
    private _selectionStore: SelectionStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _workloadsStore: WorkloadsStore;
    private _servicesStore: ServicesStore;
}