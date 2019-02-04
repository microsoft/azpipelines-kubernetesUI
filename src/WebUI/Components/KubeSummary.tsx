/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList, V1DaemonSetList, V1StatefulSetList, V1Service, V1PodList, V1Pod, V1DaemonSet, V1StatefulSet, V1PodTemplateSpec, V1ObjectMeta } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IKubernetesSummary, IVssComponentProperties, IServiceItem, IDeploymentReplicaSetItem } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsComponent } from "./DeploymentsComponent";
import "./KubeSummary.scss";
import { PodsViewComponent } from "./PodsViewComponent";
import { ServiceComponent } from "./ServiceComponent";
import { ServicesComponent } from "./ServicesComponent";
// todo :: work around till this issue is fixed in devops ui
import "azure-devops-ui/Label.scss";
import { DaemonSetListComponent } from "./DaemonSetListComponent";
import { StatefulSetListComponent } from "./StatefulSetListComponent";
import { PodsComponent } from "./PodsComponent";
import { ZeroDataComponent } from "./ZeroDataComponent";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { FilterComponent, NameKey, TypeKey } from "./FilterComponent";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { SelectedItemKeys } from "../Constants";
import { PodDetailsView } from "./PodDetailsView";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const filterToggled = new ObservableValue<boolean>(false);

//todo: refactor filter properties to respective resource type components
export interface IKubernetesContainerState extends IKubernetesSummary {
    selectedPivotKey?: string;
    selectedItem?: any;
    workloadsFilter: Filter;
    svcFilter: Filter;
    workloadsFilterState?: IFilterState;
    svcFilterState?: IFilterState;
    showSelectedItem?: boolean;
    selectedItemType?: string;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        const filter = new Filter();
        filter.subscribe(this._onWorkloadsFilterApplied, FILTER_CHANGE_EVENT);
        const svcFilter = new Filter();
        svcFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);
        this.state = {
            namespace: this.props.namespace || "",
            selectedPivotKey: workloadsPivotItemKey,
            showSelectedItem: false,
            selectedItemType: "",
            workloadsFilter: filter,
            svcFilter: svcFilter
        };

        this._setSelectedKeyPodsViewMap();
    }

    public componentDidMount(): void {
        this._populateStateData();
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

    private _getSelectedItemPodsView(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        const selectedItemType = this.state.selectedItemType;

        if (selectedItem && selectedItemType && this._selectedItemViewMap.hasOwnProperty(selectedItemType)) {
            return this._selectedItemViewMap[selectedItemType](selectedItem);
        }

        return null;
    }

    private _getReplicaSetPodDetails(selectedItem: IDeploymentReplicaSetItem): JSX.Element | null {
        if (selectedItem && selectedItem.deploymentId && selectedItem.replicaSetId) {
            const selectedItemDeploymentUId: string = selectedItem.deploymentId.toLowerCase();
            const selectedItemReplicaSetUId: string = selectedItem.replicaSetId.toLowerCase();
            const replicas = this.state.replicaSetList;
            const filteredReplica = (replicas && replicas.items || []).filter(replica => {
                return Utils.isOwnerMatched(replica.metadata, selectedItemDeploymentUId) && replica.metadata.uid.toLowerCase() === selectedItemReplicaSetUId;
            });

            if (filteredReplica) {
                return this._getPodsViewComponent(filteredReplica[0].metadata, filteredReplica[0].spec && filteredReplica[0].spec.template, selectedItem.kind || "ReplicaSet");
            }
        }

        return null;
    }

    private _getPodsViewComponent(parentMetaData: V1ObjectMeta, podTemplate: V1PodTemplateSpec, parentKind: string): JSX.Element | null {
        return (<PodsViewComponent
            parentMetaData={parentMetaData}
            podTemplate={podTemplate}
            parentKind={parentKind}
            podsPromise={this.props.kubeService && this.props.kubeService.getPods() || Promise.resolve({})} />);
    }

    private _populateStateData(): void {
        let kubeService: IKubeService = this.props.kubeService as IKubeService;
        if (!kubeService) {
            return;
        }
        kubeService.getDeployments().then(deploymentList => {
            let deploymentNamespace: string = "";
            if (!this.state.namespace) {
                for (const deployment of (deploymentList && deploymentList.items || [])) {
                    if (deployment && deployment.metadata.namespace) {
                        deploymentNamespace = deployment.metadata.namespace;
                        break;
                    }
                }
            }

            this.setState({
                deploymentList: deploymentList,
                namespace: this.state.namespace || deploymentNamespace
            });
        });

        kubeService.getReplicaSets().then(replicaSetList => {
            this.setState({ replicaSetList: replicaSetList });
        });

        kubeService.getServices().then(serviceList => {
            this.setState({ serviceList: serviceList });
        });

        kubeService.getDaemonSets().then(dameonList => {
            this.setState({ daemonSetList: dameonList });
        });

        kubeService.getStatefulSets().then(statefulSets => {
            this.setState({ statefulSetList: statefulSets });
        })

        kubeService.getPods().then(podList => {
            this.setState({
                podList: podList
            })
        })
    }

    private _getMainContent(): JSX.Element {
        return (
            <div className="main-content">
                {this._getMainHeading()}
                {this._getTotalResourceSize() > 0 ?
                    this._getMainPivot() :
                    ZeroDataComponent._getDefaultZeroData("https://kubernetes.io/docs/concepts/workloads/pods/pod/",
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
                        {this._getFilterBar()}
                        {this._getContent()}
                    </div>
                </TabContent>
            </div>
        );
    }

    private _getContent(): JSX.Element {
        if (this.state.selectedPivotKey === servicesPivotItemKey) {
            const serivceSize: number = this.state.serviceList ? this.state.serviceList.items.length : 0;
            return (serivceSize === 0 ?
                ZeroDataComponent._getDefaultZeroData("https://kubernetes.io/docs/concepts/services-networking/service/",
                    Resources.LearnMoreText, Resources.NoServicesText, Resources.CreateServiceText)
                :
                <ServicesComponent
                    servicesList={this.state.serviceList || {} as V1ServiceList}
                    onItemActivated={(e, item) => this._onSelectedItemInvoked(e, item, SelectedItemKeys.ServiceItemKey)}
                    filter={this.state.svcFilter}
                    filterState={this.state.svcFilterState}
                    nameFilter={this._getNameFilterKey()}
                    typeSelections={this._getTypeSelection()}
                />);
        }
        return (this._getWorkloadSize() === 0 ?
            ZeroDataComponent._getDefaultZeroData("https://kubernetes.io/docs/concepts/workloads/pods/pod/", Resources.LearnMoreText,
                Resources.NoWorkLoadsText, Resources.NoWorkLoadsText)
            :
            <div>
                {this._showComponent(KubeResourceType.Deployments) && this._getDeployments()}
                {this._showComponent(KubeResourceType.DaemonSets) && this._getDaemonSetsComponent()}
                {this._showComponent(KubeResourceType.StatefulSets) && this._getStatefulSetsComponent()}
                {this.state.podList && this.state.podList.items && this.state.podList.items.length > 0 &&
                    this._showComponent(KubeResourceType.Pods) && this.getOrphanPods()}
            </div>);
    }

    private _getFilterBar(): JSX.Element {
        if (this.state.selectedPivotKey === workloadsPivotItemKey) {
            return (<FilterComponent filter={this.state.workloadsFilter}
                keywordPlaceHolder={Resources.PivotWorkloadsText}
                pickListPlaceHolder={Resources.KindText}
                pickListItemsFn={this._pickListItems}
                listItemsFn={this._listItems}
                filterToggled={filterToggled}
            />);
        }
        else {
            return (<FilterComponent filter={this.state.svcFilter}
                pickListPlaceHolder={Resources.TypeText}
                keywordPlaceHolder={Resources.PivotServiceText}
                filterToggled={filterToggled}
                pickListItemsFn={() => this._generateSvcTypes()}
                listItemsFn={(item: any) => {
                    return {
                        key: item,
                        name: item
                    };
                }}
            />);
        }
    }

    private _onSelectedItemInvoked = (event: React.SyntheticEvent<HTMLElement>, item: any, itemType: string) => {
        this.setState({
            showSelectedItem: true,
            selectedItem: item,
            selectedItemType: itemType
        });
    }

    private _getServiceComponent(serviceItem: IServiceItem): JSX.Element {
        const svc = serviceItem && serviceItem.service;
        //service currently only supports equals with "and" operator. The generator generates that condition.
        const labelSelector: string = Utils.generateEqualsConditionLabelSelector(svc && svc.spec && svc.spec.selector || {});
        const podsListing: Promise<any> = labelSelector && this.props.kubeService && this.props.kubeService.getPods(labelSelector) || Promise.resolve({});
        return <ServiceComponent service={this.state.selectedItem} podListingPromise={podsListing} />;
    }

    private getOrphanPods(): JSX.Element {
        let pods: V1Pod[] = [];
        this.state.podList && this.state.podList.items && this.state.podList.items.forEach(pod => {
            if (!pod.metadata.ownerReferences) {
                pods.push(pod);
            }
        });

        return <PodsComponent
            podsToRender={pods}
            onItemActivated={(e, item) => this._onSelectedItemInvoked(e, item, SelectedItemKeys.OrphanPodKey)}
        />;
    }

    private _getDaemonSetsComponent(): JSX.Element {
        return (<DaemonSetListComponent
            daemonSetList={this.state.daemonSetList || {} as V1DaemonSetList}
            key={format("ds-list-{0}", this.state.namespace || "")}
            nameFilter={this._getNameFilterKey()}
            onItemActivated={(e, item) => this._onSelectedItemInvoked(e, item, SelectedItemKeys.DaemonSetKey)}
        />);
    }

    private _getStatefulSetsComponent(): JSX.Element {
        return (<StatefulSetListComponent
            statefulSetList={this.state.statefulSetList || {} as V1StatefulSetList}
            key={format("sts-list-{0}", this.state.namespace || "")}
            nameFilter={this._getNameFilterKey()}
            onItemActivated={(e, item) => this._onSelectedItemInvoked(e, item, SelectedItemKeys.StatefulSetKey)}
        />);
    }

    private _getDeployments(): JSX.Element {
        return (<DeploymentsComponent
            deploymentList={this.state.deploymentList || {} as V1DeploymentList}
            replicaSetList={this.state.replicaSetList || {} as V1ReplicaSetList}
            key={format("dc-{0}", this.state.namespace || "")}
            nameFilter={this._getNameFilterKey()}
            onItemActivated={(e, item) => this._onSelectedItemInvoked(e, item, SelectedItemKeys.ReplicaSetKey)}
        />);
    }

    private _onWorkloadsFilterApplied = (currentState: IFilterState) => {
        this.setState({
            workloadsFilterState: this.state.workloadsFilter.getState()
        })
    };

    private _onSvcFilterApplied = (currentState: IFilterState) => {
        this.setState({
            svcFilterState: this.state.svcFilter.getState()
        })
    };

    private _getNameFilterKey(): string | undefined {
        const filterState: IFilterState | undefined = this.state.selectedPivotKey === workloadsPivotItemKey ? this.state.workloadsFilterState : this.state.svcFilterState;
        const filterItem: IFilterItemState | null = filterState ? filterState[NameKey] : null;
        return filterItem ? (filterItem.value as string) : undefined;
    }

    private _getTypeSelection(): any[] {
        const filterState: IFilterState | undefined = this.state.selectedPivotKey === workloadsPivotItemKey ? this.state.workloadsFilterState : this.state.svcFilterState;
        const filterItem: IFilterItemState | null = filterState ? filterState[TypeKey] : null;
        const selections: any[] = filterItem ? filterItem.value : [];
        return selections;
    }

    private _showComponent(resourceType: KubeResourceType): boolean {
        const selections: KubeResourceType[] = this._getTypeSelection();
        // if no selections are made, show all components
        if (selections.length > 0) {
            return selections.indexOf(resourceType) != -1;
        }
        return true;
    }

    private _pickListItems = () => {
        return [KubeResourceType.Deployments,
        KubeResourceType.ReplicaSets,
        KubeResourceType.DaemonSets,
        KubeResourceType.StatefulSets,
        KubeResourceType.Pods];
    };

    private _listItems = (item: any) => {
        let name: string = "";
        switch (item) {
            case KubeResourceType.Deployments:
                name = Resources.DeploymentsDetailsText;
                break;
            case KubeResourceType.ReplicaSets:
                name = Resources.ReplicaSetText;
                break;
            case KubeResourceType.DaemonSets:
                name = Resources.DaemonSetText;
                break;
            case KubeResourceType.StatefulSets:
                name = Resources.StatefulSetText;
                break;
            case KubeResourceType.Pods:
                name = Resources.PodsText;
                break;
        };
        return {
            key: item.toString(),
            name: name
        };
    };

    private _generateSvcTypes(): string[] {
        let svcTypes: string[] = [];
        this.state.serviceList && this.state.serviceList.items && this.state.serviceList.items.forEach((svc) => {
            if (svcTypes.indexOf(svc.spec.type) == -1) {
                svcTypes.push(svc.spec.type);
            }
        });
        return svcTypes;
    }

    private _getWorkloadSize(): number {
        return (this.state.deploymentList ? this.state.deploymentList.items.length : 0) +
            (this.state.replicaSetList ? this.state.replicaSetList.items.length : 0) +
            (this.state.daemonSetList ? this.state.daemonSetList.items.length : 0) +
            (this.state.statefulSetList ? this.state.statefulSetList.items.length : 0) +
            (this.state.podList ? this.state.podList.items.length : 0);
    }

    private _getTotalResourceSize(): number {
        return (this._getWorkloadSize() + (this.state.serviceList ? this.state.serviceList.items.length : 0));
    }

    private _setSelectedKeyPodsViewMap() {
        this._selectedItemViewMap[SelectedItemKeys.StatefulSetKey] = (item) => this._getPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "StatefulSet");
        this._selectedItemViewMap[SelectedItemKeys.ServiceItemKey] = (item) => this._getServiceComponent(item);
        this._selectedItemViewMap[SelectedItemKeys.DaemonSetKey] = (item) => this._getPodsViewComponent(item.metadata, item.spec && item.spec.template, item.kind || "DaemonSet");
        this._selectedItemViewMap[SelectedItemKeys.OrphanPodKey] = (item) => { return <PodDetailsView pod={item} />; }
        this._selectedItemViewMap[SelectedItemKeys.ReplicaSetKey] = (item) => this._getReplicaSetPodDetails(item);
    }

    private _selectedItemViewMap: { [selectedItemKey: string]: (selectedItem: any) => JSX.Element | null } = {};
}