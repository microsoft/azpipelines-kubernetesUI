/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1DaemonSetList, V1ObjectMeta, V1Pod, V1ReplicaSet, V1ReplicaSetList, V1StatefulSet, V1StatefulSetList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { Header, TitleSize, IHeaderProps } from "azure-devops-ui/Header";
import { HeaderCommandBarWithFilter } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps } from "azure-devops-ui/Status";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { Filter, FILTER_CHANGE_EVENT, IFilterState } from "azure-devops-ui/Utilities/Filter";
import { Action, createBrowserHistory, History, Location, UnregisterCallback } from "history";
import * as queryString from "query-string";
import * as React from "react";
import { IImageService, IKubeService, KubeImage, ITelemetryService } from "../../Contracts/Contracts";
import { IImageDetails } from "../../Contracts/Types";
import { SelectedItemKeys, ServicesEvents, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { PodsDetails } from "../Pods/PodsDetails";
import { KubeFactory, DefaultTelemetryService } from "../KubeFactory";
import { PodsRightPanel } from "../Pods/PodsRightPanel";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { SelectionStore } from "../Selection/SelectionStore";
import { ServiceDetails } from "../Services/ServiceDetails";
import { ServicesPivot } from "../Services/ServicesPivot";
import { ServicesStore } from "../Services/ServicesStore";
import { IPodDetailsSelectionProperties, IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { WorkloadDetails } from "../Workloads/WorkloadDetails";
import { WorkloadsActionsCreator } from "../Workloads/WorkloadsActionsCreator";
import { WorkloadsPivot } from "../Workloads/WorkloadsPivot";
import { WorkloadsStore } from "../Workloads/WorkloadsStore";
import "./KubeSummary.scss";
import { KubeZeroData } from "./KubeZeroData";
import { PodsStore } from "../Pods/PodsStore";
import { getServiceItems } from "../Services/ServiceUtils";
import { setContentReaderComponent } from "./KubeConsumer";

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
    selectedItemUid?: string;
    selectedItemProperties?: { [key: string]: any };
    resourceSize: number;
    workloadsFilter: Filter;
    svcFilter: Filter;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    /**
     * Header title of the kube summary page
     */
    title: string;

    /**
     * Instance of IKubeService which would be used to query information
     */
    kubeService: IKubeService;

    /**
     * Instance of IImageService. This is optional
     */
    imageService?: IImageService;

    /**
     * Namespace of the kubernetes objects being displayed
     */
    namespace?: string;

    /**
     * Cluster name of the kubernetes objects being displayed
     */
    clusterName?: string;

    /**
     * Instance of ITelemetryService
     */
    telemteryService?: ITelemetryService;

    /**
     * Callback to be invoked to go back from KubeSummary
     * If provided, a back button will be added to header
     */
    onTitleBackClick?: () => void;

    getImageLocation?: (image: KubeImage) => string | undefined;
    // props has text and reader options.
    // reader options are of type monaco.editor.IEditorConstructionOptions
    getContentReaderComponent?: (props?: any) => React.ReactNode;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        KubeSummary._imageService = this.props.imageService;
        KubeSummary._kubeservice = this.props.kubeService;
        setContentReaderComponent(this.props.getContentReaderComponent);

        this._initializeFactorySettings();
        const workloadsFilter = new Filter();
        const servicesFilter = new Filter();
        workloadsFilter.subscribe(this._onWorkloadsFilterApplied, FILTER_CHANGE_EVENT);
        servicesFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);

        this._setSelectedKeyPodsViewMap();
        this._populateObjectFinder();

        this._historyService = createBrowserHistory();
        const queryParams = queryString.parse(this._historyService.location.search)

        let selectedPivot = workloadsPivotItemKey;

        // If type is not present, and view is present, load corresponding tab
        if (!queryParams.type && !!queryParams.view) {
            selectedPivot = queryParams.view as string;
        }

        // Take namespace from deployment store and rest from selection store
        this.state = {
            namespace: this.props.namespace || "",
            selectedPivotKey: selectedPivot,
            showSelectedItem: queryParams.uid ? true : false,
            selectedItemUid: queryParams.uid as string,
            selectedItemProperties: queryParams as { [key: string]: any },
            selectedItem: undefined,
            selectedItemType: queryParams.type as string || "",
            resourceSize: 0,
            svcFilter: servicesFilter,
            workloadsFilter: workloadsFilter
        };

        this._servicesStore = StoreManager.GetStore<ServicesStore>(ServicesStore);
        this._selectionStore = StoreManager.GetStore<SelectionStore>(SelectionStore);
        // ensure workload store is created before get Deployments action
        this._workloadsStore = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);

        this._workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);

        this._workloadsStore.addListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
        this._workloadsStore.addListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._servicesStore.addListener(ServicesEvents.ServicesFoundEvent, this._onDataFound);
        this._selectionStore.addChangedListener(this._onSelectionStoreChanged);

        // fetch deployments in parent component
        // so we can show nameSpace in heading and namespace is obtained from deployment metadata
        // this data also helpful in deciding to show zero data or workloads
        this._workloadsActionCreator.getDeployments(KubeSummary.getKubeService());
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
        this._historyUnlisten();
        this._workloadsStore.removeListener(WorkloadsEvents.DeploymentsFetchedEvent, this._setNamespaceOnDeploymentsFetched);
        this._workloadsStore.removeListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._servicesStore.removeListener(ServicesEvents.ServicesFoundEvent, this._onDataFound);
        this._selectionStore.removeChangedListener(this._onSelectionStoreChanged);
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
            this.setState({ selectedItemType: typeName, selectedItem: selectedItem, showSelectedItem: true, selectedItemUid: objectId, selectedItemProperties: routeValues });
        }
        else {
            this.setState({ selectedItemType: "", selectedItem: undefined, showSelectedItem: false, selectedItemUid: undefined });
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
        const headerProps: IHeaderProps = {
            title: this.props.title,
            titleSize: TitleSize.Large,
            className: "content-main-heading",
            description: this.props.clusterName
                ? localeFormat(Resources.SummaryHeaderSubTextFormat, this.props.clusterName)
                : localeFormat(Resources.NamespaceHeadingText, this.state.namespace || "")
        };

        if (this.props.onTitleBackClick) {
            headerProps.titleIconProps = { iconName: "Back", onClick: this.props.onTitleBackClick, className: "cursor-pointer" };
        }

        // must be short syntax or React.Fragment, do not use div here to include heading and content.
        return (
            <>
                <Header {...headerProps} />
                
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
                    onSelectedTabChanged={(key: string) => { this._selectTab(key); }}
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
        const isEmptyItemAllowed = ![SelectedItemKeys.OrphanPodKey].some(s => s === selectedItemType);
        // ToDo :: Currently for imageDetails type, the selected item will be undefined, hence adding below check. Remove this once we have data from imageService
        if (selectedItemType
            && (selectedItem || isEmptyItemAllowed)
            && this._selectedItemViewMap.hasOwnProperty(selectedItemType)) {
            return this._selectedItemViewMap[selectedItemType](selectedItem, this.state.selectedItemUid, this.state.selectedItemProperties);
        }

        return null;
    }

    private _getWorkloadPodsViewComponent(
        item: V1ReplicaSet | V1DaemonSet | V1StatefulSet,
        defaultTypeString: string,
        selectedItemType: SelectedItemKeys,
        getStatusProps: (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet) => { statusProps: IStatusProps | undefined, pods: string, podsTooltip: string }
    ): JSX.Element | null {
        return (
            <WorkloadDetails
                item={item}
                parentKind={(item && item.kind) || defaultTypeString}
                itemTypeKey={selectedItemType}
                getStatusProps={getStatusProps}
            />
        );
    }

    private _getPodDetailsComponent(podUid?: string, properties?: IPodDetailsSelectionProperties): JSX.Element | null {
        const selectionProperties = properties as IPodDetailsSelectionProperties;
        return selectionProperties ? (
            <PodsDetails
                parentUid={selectionProperties.parentUid}
                serviceName={selectionProperties.serviceName}
                serviceSelector={selectionProperties.serviceSelector}
                selectedPodUid={podUid} />)
            : null;
    }

    private _selectTab(pivotItemKey: string): void {
        let routeValues: queryString.OutputParams = queryString.parse(this._historyService.location.search);
        routeValues["view"] = pivotItemKey;

        this._historyService.replace({
            pathname: this._historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });

        this.setState({ selectedPivotKey: pivotItemKey });
    }

    private _onSelectionStoreChanged = () => {
        const selectionStoreState = this._selectionStore.getState();

        const setStateWithSelection = (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem | V1Pod | IImageDetails | undefined) => {
            this.setState({
                showSelectedItem: selectionStoreState.showSelectedItem,
                selectedItem: item,
                selectedItemType: selectionStoreState.selectedItemType,
                selectedItemUid: selectionStoreState.itemUID,
                selectedItemProperties: selectionStoreState.properties
            });
        }

        // If the selection only has id and doesn't have the item, we would need to fetch the item
        if (!!selectionStoreState.itemUID && !selectionStoreState.selectedItem) {
            let invokedFunc: (() => Promise<V1DaemonSetList | V1ReplicaSetList | V1StatefulSetList>) | undefined = undefined;
            let item: V1DaemonSet | V1ReplicaSet | V1StatefulSet | undefined = undefined;

            const getMatchingItem = <T extends { metadata: V1ObjectMeta }>(items: T[]): T | undefined => {
                if (items && items.length) {
                    return items.find(r => r.metadata.uid === selectionStoreState.itemUID);
                }
            }
            switch (selectionStoreState.selectedItemType) {
                case SelectedItemKeys.ReplicaSetKey:
                    const replicaSets = this._workloadsStore.getState().replicaSetList;
                    if (replicaSets) {
                        item = getMatchingItem(replicaSets.items);
                    }
                    if (!item) {
                        invokedFunc = () => KubeSummary.getKubeService().getReplicaSets();
                    }
                    break;
                case SelectedItemKeys.StatefulSetKey:
                    const statefulSets = this._workloadsStore.getState().statefulSetList;
                    if (statefulSets) {
                        item = getMatchingItem(statefulSets.items);
                    }
                    if (!item) {
                        invokedFunc = () => KubeSummary.getKubeService().getStatefulSets();
                    }
                    break;
                case SelectedItemKeys.DaemonSetKey:
                    const daemonSets = this._workloadsStore.getState().daemonSetList;
                    if (daemonSets) {
                        item = getMatchingItem(daemonSets.items);
                    }

                    if (!item) {
                        invokedFunc = () => KubeSummary.getKubeService().getDaemonSets();
                    }
                    break;
            }

            if (invokedFunc) {
                invokedFunc().then(list => {
                    // If the selection has been modified while this promise was being resolved, don't do anything
                    if (selectionStoreState.itemUID !== this._selectionStore.getState().itemUID) {
                        return;
                    }

                    if (list && list.items && list.items.length) {
                        item = (list.items as { metadata: V1ObjectMeta }[]).find((i: { metadata: V1ObjectMeta }) => i.metadata.uid === selectionStoreState.itemUID) as V1DaemonSet | V1ReplicaSet | V1StatefulSet;
                    }

                    if (item) {
                        setStateWithSelection(item);
                    }
                });
            }
            else {
                setStateWithSelection(item);
            }
        }
        else {
            setStateWithSelection(selectionStoreState.selectedItem);
        }
    }

    private _setSelectedKeyPodsViewMap = () => {
        this._selectedItemViewMap[SelectedItemKeys.ReplicaSetKey] = (item) => this._getWorkloadPodsViewComponent(
            item,
            "ReplicaSet",
            SelectedItemKeys.ReplicaSetKey,
            (item) => {
                const status = (item as V1ReplicaSet).status;
                return Utils.getPodsStatusProps(status.readyReplicas, status.replicas);
            });

        this._selectedItemViewMap[SelectedItemKeys.StatefulSetKey] = (item) => this._getWorkloadPodsViewComponent(
            item,
            "StatefulSet",
            SelectedItemKeys.StatefulSetKey,
            (item) => {
                const status = (item as V1StatefulSet).status;
                return Utils.getPodsStatusProps(status.readyReplicas, status.replicas);
            });

        this._selectedItemViewMap[SelectedItemKeys.DaemonSetKey] = (item) => this._getWorkloadPodsViewComponent(
            item,
            "DaemonSet",
            SelectedItemKeys.DaemonSetKey,
            (item) => {
                const status = (item as V1DaemonSet).status;
                return Utils.getPodsStatusProps(status.numberAvailable, status.desiredNumberScheduled);
            });

        this._selectedItemViewMap[SelectedItemKeys.OrphanPodKey] = (pod) => {
            const { statusProps, tooltip } = Utils.generatePodStatusProps(pod.status);
            return <PodsRightPanel key={pod.metadata.uid} pod={pod} podStatusProps={statusProps} statusTooltip={tooltip} />;
        };

        this._selectedItemViewMap[SelectedItemKeys.ServiceItemKey] = (service) => { return <ServiceDetails service={service} parentKind={(service && service.kind) || "Service"} />; };
        this._selectedItemViewMap[SelectedItemKeys.ImageDetailsKey] = (item) => { return <ImageDetails imageDetails={item} onBackButtonClick={this._setSelectionStateFalse} />; };
        this._selectedItemViewMap[SelectedItemKeys.PodDetailsKey] = (item, uid, properties?) => this._getPodDetailsComponent(uid, properties as IPodDetailsSelectionProperties);
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
        this._objectFinder[SelectedItemKeys.PodDetailsKey] = (uid) => KubeSummary._getFilteredFirstObject(this._podsStore.getState().podsList, uid);
        this._objectFinder[SelectedItemKeys.ServiceItemKey] = (uid) => {
            const filteredService = KubeSummary._getFilteredFirstObject(this._servicesStore.getState().serviceList, uid);
            return filteredService ? getServiceItems([filteredService])[0] : undefined;
        };
    }

    private static _getFilteredFirstObject(itemList: { items?: { metadata: V1ObjectMeta }[] } | undefined, uid: string): any {
        const filteredItems = ((itemList || {}).items || []).filter(r => r.metadata.uid === uid);
        return filteredItems && filteredItems.length > 0 ? filteredItems[0] : undefined
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
        KubeFactory.telemetryService = this.props.telemteryService || new DefaultTelemetryService();
        KubeFactory.markTTI = this.props.markTTI || KubeFactory.markTTI;
        KubeFactory.getImageLocation = this.props.getImageLocation || KubeFactory.getImageLocation;
    }

    private _selectedItemViewMap: { [selectedItemKey: string]: (selectedItem: any, selectedItemUid?: string, properties?: { [key: string]: any }) => JSX.Element | null } = {};
    private _objectFinder: { [selectedItemKey: string]: (name: string) => V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem | undefined } = {};
    private _selectionStore: SelectionStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _workloadsStore: WorkloadsStore;
    private _podsStore: PodsStore
    private _servicesStore: ServicesStore;
    private _historyService: History;
    private _historyUnlisten: UnregisterCallback;
    private _selectionActionCreator: SelectionActionsCreator;
    private static _imageService: IImageService | undefined;
    private static _kubeservice: IKubeService;
}