/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1ObjectMeta, V1Pod, V1PodTemplateSpec, V1ReplicaSet, V1StatefulSet } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { HeaderCommandBarWithFilter } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { Filter, FILTER_CHANGE_EVENT, IFilterState } from "azure-devops-ui/Utilities/Filter";
import { Action, createBrowserHistory, History, Location, UnregisterCallback } from "history";
import * as queryString from "query-string";
import * as React from "react";
import { IImageService, IKubeService, KubeImage } from "../../Contracts/Contracts";
import { IImageDetails } from "../../Contracts/Types";
import { SelectedItemKeys, ServicesEvents, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { KubeFactory } from "../KubeFactory";
import { PodOverview } from "../Pods/PodOverview";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { SelectionStore } from "../Selection/SelectionStore";
import { ServiceDetails } from "../Services/ServiceDetails";
import { ServicesPivot } from "../Services/ServicesPivot";
import { ServicesStore } from "../Services/ServicesStore";
import { ServicesTable } from "../Services/ServicesTable";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { WorkloadDetails } from "../Workloads/WorkloadDetails";
import { WorkloadsActionsCreator } from "../Workloads/WorkloadsActionsCreator";
import { WorkloadsPivot } from "../Workloads/WorkloadsPivot";
import { WorkloadsStore } from "../Workloads/WorkloadsStore";
import "./KubeSummary.scss";
import { KubeZeroData } from "./KubeZeroData";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const workloadsFilterToggled = new ObservableValue<boolean>(false);
const servicesFilterToggled = new ObservableValue<boolean>(false);

// todo: refactor filter properties to respective resource type components
export interface IKubernetesContainerState {
    namespace?: string;
    selectedPivotKey?: string;
    selectedItem?: V1ReplicaSet | V1DaemonSet | V1StatefulSet | V1Pod | IServiceItem | IImageDetails;
    showSelectedItem?: boolean;
    selectedItemType?: string;
    resourceSize: number;
    workloadsFilter: Filter;
    svcFilter: Filter;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    imageService?: IImageService;
    namespace?: string;
    markTTI?: () => void;
    getImageLocation?: (image: KubeImage) => string | undefined;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        KubeSummary._imageService = this.props.imageService;
        KubeSummary._kubeservice = this.props.kubeService;

        this._initializeFactorySettings();
        const workloadsFilter = new Filter();
        const servicesFilter = new Filter();
        workloadsFilter.subscribe(this._onWorkloadsFilterApplied, FILTER_CHANGE_EVENT);
        servicesFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);

        this._setSelectedKeyPodsViewMap();
        this._populateObjectFinder();

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
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);

        // Ensure workload store is created before get Deployments action
        this._workloadsStore = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        // Fetch deployments in parent component we need to show nameSpace in heading and namespace is obtained from deployment metadata
        this._workloadsActionCreator.getDeployments(KubeSummary.getKubeService());
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
        // this needs to be called after the data is loaded so that we can decide which object is selected as per the URL
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

    public static getImageService(): IImageService | undefined {
        return KubeSummary._imageService;
    }

    public static getKubeService(): IKubeService {
        return KubeSummary._kubeservice;
    }

    private _updateStateFromHistory = (routeValues: queryString.OutputParams): void => {
        if (routeValues["type"] && routeValues["uid"]) {
            const typeName: string = routeValues["type"] as string;
            const objectId: string = routeValues["uid"] as string;
            const selectedItem = this._objectFinder[typeName](objectId);
            this.setState({ selectedItemType: typeName, selectedItem: selectedItem, showSelectedItem: true });
        }
        else {
            this.setState({ selectedItemType: "", selectedItem: undefined, showSelectedItem: false });
        }
    }

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
        this.setState({});
    }

    private _onSvcFilterApplied = (currentState: IFilterState) => {
        this.setState({});
    }

    private _onDataFound = (): void => {
        const workloadSize = this._workloadsStore.getWorkloadSize();
        const servicesSize = this._servicesStore.getServicesSize();
        const resourceSize = workloadSize + servicesSize;
        if (this.state.resourceSize <= 0 && resourceSize > 0) {
            this.setState({ resourceSize: workloadSize + servicesSize });
        }
    }

    private _getMainContent(): JSX.Element {
        const pageContent = this.state.resourceSize > 0 ? this._getMainPivot() : this._getZeroData();
        // must be short syntax or React.Fragment, do not use div here to include heading and content.
        return (
            <>
                <Header
                    title={this.props.title}
                    titleSize={TitleSize.Large}
                    className={"content-main-heading"}
                    description={localeFormat(Resources.NamespaceHeadingText, this.state.namespace || "")}
                />
                {pageContent}
            </>
        );
    }

    private _getMainPivot(): JSX.Element {
        const commonProps = {
            kubeService: this.props.kubeService,
            namespace: this.state.namespace
        };

        const tabContent = this.state.selectedPivotKey === servicesPivotItemKey
            ? <ServicesPivot {...commonProps} filter={this.state.svcFilter} filterToggled={servicesFilterToggled} />
            : <WorkloadsPivot {...commonProps} filter={this.state.workloadsFilter} filterToggled={workloadsFilterToggled} />;

        // must be short syntax or React.Fragment, do not use div here to include heading and content.
        return (
            <>
                <TabBar
                    selectedTabId={this.state.selectedPivotKey || workloadsPivotItemKey}
                    onSelectedTabChanged={(key: string) => { this.setState({ selectedPivotKey: key }); }}
                    renderAdditionalContent={() => { return this._getFilterHeaderBar(); }}
                    disableSticky={false}
                >
                    <Tab name={Resources.PivotWorkloadsText} id={workloadsPivotItemKey} />
                    <Tab name={Resources.PivotServiceText} id={servicesPivotItemKey} />
                </TabBar>
                <div className="page-content page-content-top k8s-pivot-content">
                    {tabContent}
                </div>
            </>
        );
    }

    private _getSelectedItemPodsView(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        const selectedItemType = this.state.selectedItemType;
        // ToDo :: Currently for imageDetails type, the selected item will be undefined, hence adding below check. Remove this once we have data from imageService
        if (selectedItemType && (selectedItem || selectedItemType === SelectedItemKeys.ImageDetailsKey) && this._selectedItemViewMap.hasOwnProperty(selectedItemType)) {
            return this._selectedItemViewMap[selectedItemType](selectedItem);
        }

        return null;
    }

    private _getWorkoadPodsViewComponent(
        item: V1ReplicaSet | V1DaemonSet | V1StatefulSet,
        defaultType: string,
        getCurrentScheduledPods: (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet) => number,
        getDesiredPods: (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet) => number
    ): JSX.Element | null {
        const currentScheduledPods = getCurrentScheduledPods(item);
        const desiredPods = getDesiredPods(item);
        const statusProps = Utils.getPodsStatusProps(currentScheduledPods, desiredPods);

        return (
            <WorkloadDetails
                parentMetaData={item.metadata}
                podTemplate={item.spec && item.spec.template}
                selector={item.spec && item.spec.selector}
                parentKind={item.kind || defaultType}
                statusProps={statusProps}
            />
        );
    }

    private _onSelectionStoreChanged = () => {
        const selectionStoreState = this._selectionStore.getState();
        this.setState({
            showSelectedItem: selectionStoreState.showSelectedItem,
            selectedItem: selectionStoreState.selectedItem,
            selectedItemType: selectionStoreState.selectedItemType
        });
    }

    private _setSelectedKeyPodsViewMap = () => {
        this._selectedItemViewMap[SelectedItemKeys.StatefulSetKey] = (item) => this._getWorkoadPodsViewComponent(item, "StatefulSet", (item) => (item as V1StatefulSet).status.currentReplicas, (item) => (item as V1StatefulSet).status.replicas);
        this._selectedItemViewMap[SelectedItemKeys.ServiceItemKey] = (item) => { return <ServiceDetails service={item} parentKind={item.kind || "Service"} /> };
        this._selectedItemViewMap[SelectedItemKeys.DaemonSetKey] = (item) => this._getWorkoadPodsViewComponent(item, "DaemonSet", (item) => (item as V1DaemonSet).status.currentNumberScheduled, (item) => (item as V1DaemonSet).status.desiredNumberScheduled);
        this._selectedItemViewMap[SelectedItemKeys.OrphanPodKey] = (item) => { return <PodOverview pod={item} />; };
        this._selectedItemViewMap[SelectedItemKeys.ReplicaSetKey] = (item) => this._getWorkoadPodsViewComponent(item, "ReplicaSet", (item) => (item as V1ReplicaSet).status.availableReplicas, (item) => (item as V1ReplicaSet).status.replicas);
        this._selectedItemViewMap[SelectedItemKeys.ImageDetailsKey] = (item) => { return <ImageDetails imageDetails={item} onBackButtonClick={this._setSelectionStateFalse} /> }
    }

    private _setSelectionStateFalse = () => {
        const payload: ISelectionPayload = {
            item: undefined,
            itemUID: "",
            showSelectedItem: false,
            selectedItemType: ""
        };
        this._selectionActionCreator.selectItem(payload);
    }

    private _populateObjectFinder(): void {
        this._objectFinder[SelectedItemKeys.ReplicaSetKey] = (uid) => KubeSummary._getFilteredFirstObject(this._workloadsStore.getState().replicaSetList, uid);
        this._objectFinder[SelectedItemKeys.StatefulSetKey] = (uid) => KubeSummary._getFilteredFirstObject(this._workloadsStore.getState().statefulSetList, uid);
        this._objectFinder[SelectedItemKeys.DaemonSetKey] = (uid) => KubeSummary._getFilteredFirstObject(this._workloadsStore.getState().daemonSetList, uid);
        this._objectFinder[SelectedItemKeys.ServiceItemKey] = (uid) => {
            const filteredServices = KubeSummary._getFilteredFirstObject(this._servicesStore.getState().serviceList, uid);
            return ServicesTable.getServiceItems(filteredServices)[0];
        };
    }

    private static _getFilteredFirstObject(itemList: any, uid: string): any {
        itemList = (itemList || {}) as any;
        const filteredItems = (itemList.items || []).filter(r => r.metadata.uid === uid);
        return filteredItems && filteredItems.length > 0 ? filteredItems[0] : {} as any;
    }

    private _getFilterHeaderBar(): JSX.Element {
        return (
            <>
                <ConditionalChildren renderChildren={!this.state.selectedPivotKey || this.state.selectedPivotKey === workloadsPivotItemKey}>
                    <HeaderCommandBarWithFilter filter={this.state.workloadsFilter} filterToggled={workloadsFilterToggled} items={[]} />
                </ConditionalChildren>
                <ConditionalChildren renderChildren={this.state.selectedPivotKey === servicesPivotItemKey}>
                    <HeaderCommandBarWithFilter filter={this.state.svcFilter} filterToggled={servicesFilterToggled} items={[]} />
                </ConditionalChildren>
            </>
        );
    }

    private _getZeroData(): JSX.Element {
        return KubeZeroData.getDefaultZeroData();
    }

    private _initializeFactorySettings(): void {
        KubeFactory.markTTI = this.props.markTTI || KubeFactory.markTTI;
        KubeFactory.getImageLocation = this.props.getImageLocation || KubeFactory.getImageLocation;
    }

    private _selectedItemViewMap: { [selectedItemKey: string]: (selectedItem: any) => JSX.Element | null } = {};
    private _objectFinder: { [selectedItemKey: string]: (name: string) => V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem } = {};
    private _selectionStore: SelectionStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _workloadsStore: WorkloadsStore;
    private _servicesStore: ServicesStore;
    private _historyService: History;
    private _historyUnlisten: UnregisterCallback;
    private _selectionActionCreator: SelectionActionsCreator;
    private static _imageService: IImageService | undefined;
    private static _kubeservice: IKubeService;
}