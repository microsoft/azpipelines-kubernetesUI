/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1ObjectMeta, V1Pod, V1PodTemplateSpec, V1ReplicaSet, V1StatefulSet, V1ReplicaSetList, V1StatefulSetList, V1DaemonSetList, V1ServiceList, V1Service } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { HeaderCommandBarWithFilter } from "azure-devops-ui/HeaderCommandBar";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Page } from "azure-devops-ui/Page"
import { Filter, FILTER_CHANGE_EVENT, IFilterState } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { SelectedItemKeys, ServicesEvents, WorkloadsEvents, HyperLinks } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodOverview } from "../Pods/PodOverview";
import * as Resources from "../Resources";
import { SelectionStore } from "../Selection/SelectionStore";
import { ServiceDetails } from "../Services/ServiceDetails";
import { ServicesPivot } from "../Services/ServicesPivot";
import { ServicesStore } from "../Services/ServicesStore";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { WorkloadDetails } from "../Workloads/WorkloadDetails";
import { WorkloadsActionsCreator } from "../Workloads/WorkloadsActionsCreator";
import { WorkloadsPivot } from "../Workloads/WorkloadsPivot";
import { WorkloadsStore } from "../Workloads/WorkloadsStore";
import "./KubeSummary.scss";
import { KubeZeroData, IKubeZeroDataProps } from "./KubeZeroData";
import { Utils } from "../Utils";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IKubeService } from "../../Contracts/Contracts";
import { createBrowserHistory, History, UnregisterCallback, Action, Location } from "history";
import * as queryString from "query-string";
import { ServicesTable } from "../Services/ServicesTable";

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

export interface ImageLocations {
    zeroData: string;
    zeroResults: string;
    zeroWorkloads: string;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
    markTTI?: () => void;
    imageLocations?: ImageLocations;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});

        const workloadsFilter = new Filter();
        const servicesFilter = new Filter();
        workloadsFilter.subscribe(this._onWorkloadsFilterApplied, FILTER_CHANGE_EVENT);
        servicesFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);

        this._setSelectedKeyPodsViewMap();
        this._populateObjectFinder();

        KubeSummary.ImageLocations = this.props.imageLocations || this._getDefaultImageLocations();

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

        this._historyService = createBrowserHistory();
    }

    public render(): React.ReactNode {
        return (
            <Surface background={SurfaceBackground.neutral}>
                <Page className={"kubernetes-container flex flex-grow"}>
                    {
                        this.state.showSelectedItem ?
                            this._getSelectedItemPodsView() :
                            this._getMainContent()
                    }
                </Page>
            </Surface>
        );
    }

    public componentDidMount(): void {
        // This needs to be called after the data is loaded so that we can decide which object is selected as per the URL
        setTimeout(() => {
            this._updateStateFromHistory(queryString.parse(this._historyService.location.search));
            this._historyUnlisten = this._historyService.listen(this._onHistoryChanged);            
        }, 100);
    }

    public componentWillUnmount(): void {
        this._selectionStore.removeChangedListener(this._onSelectionStoreChanged);
        this._workloadsStore.removeListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
        this._workloadsStore.removeListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._servicesStore.removeListener(ServicesEvents.ServicesFoundEvent, this._onDataFound);
        this._historyUnlisten();
    }

    private _updateStateFromHistory = (routeValues: queryString.OutputParams): void => {
        if (routeValues["type"] && routeValues["uid"])
        {
            const typeName: string = routeValues["type"] as string;
            const objectId: string = routeValues["uid"] as string;
            const selectedItem = this._objectFinder[typeName](objectId);
            this.setState({selectedItemType: typeName, selectedItem: selectedItem, showSelectedItem: true});
        }
        else {
            this.setState({selectedItemType: "", selectedItem: undefined, showSelectedItem: false});
        }
    };

    private _onHistoryChanged = (location: Location, action: Action): void => {      
        let routeValues: queryString.OutputParams = queryString.parse(location.search);
        this._updateStateFromHistory(routeValues);
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
                {this.state.resourceSize > 0 ? this._getMainPivot() : this._getZeroData()}
            </div>
        );
    }

    private _getMainHeading(): JSX.Element | null {
        return (
            <Header
                title={this.props.title}
                titleSize={TitleSize.Large}
                className={"content-main-heading"}
                description={localeFormat(Resources.NamespaceHeadingText, this.state.namespace || "")}
            />);
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
                    {this.state.selectedPivotKey === workloadsPivotItemKey && <WorkloadsPivot kubeService={this.props.kubeService} namespace={this.state.namespace} filter={this.state.workloadsFilter} filterToggled={workloadsFilterToggled} markTTI={this.props.markTTI} />}
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

    private _getWorkoadPodsViewComponent(parentMetaData: V1ObjectMeta, podTemplate: V1PodTemplateSpec, parentKind: string, currentScheduledPods: number, desiredPods: number): JSX.Element | null {
        const statusProps = Utils._getPodsStatusProps(currentScheduledPods, desiredPods);

        return (<WorkloadDetails
            parentMetaData={parentMetaData}
            podTemplate={podTemplate}
            parentKind={parentKind}
            statusProps={statusProps} />);
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
        this._selectedItemViewMap[SelectedItemKeys.StatefulSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "StatefulSet", item.status.currentReplicas, item.status.replicas);
        this._selectedItemViewMap[SelectedItemKeys.ServiceItemKey] = (item) => { return <ServiceDetails kubeService={this.props.kubeService} service={item} /> };
        this._selectedItemViewMap[SelectedItemKeys.DaemonSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "DaemonSet", item.status.currentNumberScheduled, item.status.desiredNumberScheduled);
        this._selectedItemViewMap[SelectedItemKeys.OrphanPodKey] = (item) => { return <PodOverview pod={item} />; }
        this._selectedItemViewMap[SelectedItemKeys.ReplicaSetKey] = (item) => this._getWorkoadPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "ReplicaSet", item.status.availableReplicas, item.status.replicas);
    }

    private _populateObjectFinder() {
        this._objectFinder[SelectedItemKeys.ReplicaSetKey] = (uid) => (this._workloadsStore.getState().replicaSetList as V1ReplicaSetList).items.filter(r => r.metadata.uid == uid)[0];
        this._objectFinder[SelectedItemKeys.StatefulSetKey] = (uid) => (this._workloadsStore.getState().statefulSetList as V1StatefulSetList).items.filter(r => r.metadata.uid == uid)[0];
        this._objectFinder[SelectedItemKeys.DaemonSetKey] = (uid) => (this._workloadsStore.getState().daemonSetList as V1DaemonSetList).items.filter(r => r.metadata.uid == uid)[0];
        this._objectFinder[SelectedItemKeys.ServiceItemKey] = (uid) => {
            let filteredServices: V1Service[] =  (this._servicesStore.getState().serviceList as V1ServiceList).items.filter(r => r.metadata.uid == uid);
            return ServicesTable.getServiceItems(filteredServices)[0];
        }
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

    private _getZeroData(): JSX.Element {
        const zeroDataProps: IKubeZeroDataProps = {
            imagePath: KubeSummary.ImageLocations.zeroData,
            hyperLink: HyperLinks.WorkloadsLink,
            hyperLinkLabel: Resources.LearnMoreKubeResourceText,
            descriptionText: Resources.DeployKubeResourceText,
            primaryText: Resources.StartUsingKubeResourceText,
            className: "zerod-side-align-content"
        }
        return (KubeZeroData.getDefaultZeroData(zeroDataProps));
    }

    private _getDefaultImageLocations(): ImageLocations {
        return {
            zeroData: require("../../img/zero-data.svg"),
            zeroResults: require("../../img/zero-results.svg"),
            zeroWorkloads: require("../../img/zero-workloads.svg")
        } as ImageLocations;
    }

    public static ImageLocations: ImageLocations = {} as ImageLocations;

    private _selectedItemViewMap: { [selectedItemKey: string]: (selectedItem: any) => JSX.Element | null } = {};
    private _objectFinder: { [selectedItemKey: string]: (name: string) => V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem } = {};
    private _selectionStore: SelectionStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _workloadsStore: WorkloadsStore;
    private _servicesStore: ServicesStore;
    private _historyService: History;
    private _historyUnlisten: UnregisterCallback;
}