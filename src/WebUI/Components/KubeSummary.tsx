/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList, V1DaemonSetList, V1StatefulSetList, V1Service, V1PodList, V1Pod } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IKubernetesSummary, IVssComponentProperties, IServiceItem, IDeploymentItem } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsComponent } from "./DeploymentsComponent";
import "./KubeSummary.scss";
import { IReplicaSetListComponentProperties, ReplicaSetListComponent } from "./ReplicaSetListComponent";
import { ServiceComponent } from "./ServiceComponent";
import { ServicesComponent } from "./ServicesComponent";
// todo :: work around till this issue is fixed in devops ui
import "azure-devops-ui/Label.scss";
import { DaemonSetListingComponent } from "./DaemonSetListingComponent";
import { StatefulSetListingComponent } from "./StatefulSetListingComponent";
import { PodsComponent } from "./PodsComponent";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { FilterComponent } from "./FilterComponent";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const filterToggled = new ObservableValue<boolean>(false);

export interface IKubernetesContainerState extends IKubernetesSummary {
    selectedKey?: string;
    showSummary?: boolean;
    showDeployment?: boolean;
    showService?: boolean;
    selectedItem?: any;
    filter:Filter;
    svcFilter: Filter;
    workloadsFilterState?:IFilterState;
    svcFilterState?: IFilterState;
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
        filter.subscribe(this._onFilterApplied, FILTER_CHANGE_EVENT);
        const svcFilter = new Filter();
        svcFilter.subscribe(this._onSvcFilterApplied, FILTER_CHANGE_EVENT);
        this.state = {
            namespace: this.props.namespace || "",
            selectedKey: workloadsPivotItemKey,
            showSummary: true,
            showDeployment: false,
            showService: false,
            filter: filter,
            svcFilter: svcFilter
        };
    }

    public componentDidMount(): void {
        this._populateStateData();
    }

    public render(): React.ReactNode {
        return (
            <div className={"kubernetes-container"}>
                {
                    !!this.state.showSummary &&
                    this._getMainContent()
                }
                {
                    !!this.state.showDeployment &&
                    this._getReplicaSetPodListComponent()
                }
                {
                    !!this.state.showService &&
                    this._getServiceComponent()
                }
            </div >
        );
    }

    private _getReplicaSetPodListComponent(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        if (selectedItem) {
            const selectedItemUId: string = selectedItem.uid.toLowerCase();
            const replicas = this.state.replicaSetList;
            const filteredReplicas = (replicas && replicas.items || []).filter(replica => {
                return Utils.isOwnerMatched(replica.metadata, selectedItemUId);
            });

            if (filteredReplicas) {
                let replicaDict: { [uid: string]: V1ReplicaSet } = {};
                filteredReplicas.forEach(replica => {
                    const replicaUId = replica.metadata.uid.toLowerCase();
                    replicaDict[replicaUId] = replica;
                });

                const replicaSetList: IReplicaSetListComponentProperties = {
                    replicas: replicaDict,
                    deployment: selectedItem.deployment,
                    podsPromise: this.props.kubeService && this.props.kubeService.getPods() || Promise.resolve({})
                };

                return (<ReplicaSetListComponent {...replicaSetList} />);
            }
        }

        return null;
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

            this.setState({ deploymentList: deploymentList, namespace: this.state.namespace || deploymentNamespace });
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
                {this._getMainPivot()}
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
                <TabBar onSelectedTabChanged={(key: string) => { this.setState({ selectedKey: key }) }}
                    orientation={0}
                    selectedTabId={this.state.selectedKey}
                    renderAdditionalContent={() => {
                        return (<HeaderCommandBarWithFilter filter={this.state.selectedKey === workloadsPivotItemKey ?
                            this.state.filter : this.state.svcFilter}
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
        if (this.state.selectedKey === servicesPivotItemKey) {
            return (<ServicesComponent
                servicesList={this.state.serviceList || {} as V1ServiceList}
                onItemActivated={this._onServiceItemInvoked}
                filter={this.state.svcFilter}
                filterState={this.state.svcFilterState}
                nameFilter={this._getNameFilterKey()}
                typeSelections={this._getTypeSelection()}
            />);
        }
        return (<div>
            {this._showComponent(KubeResourceType.Deployments) && this._getDeployments()}
            {this._showComponent(KubeResourceType.DaemonSets) && this._getDaemonSetsComponent()}
            {this._showComponent(KubeResourceType.StatefulSets) && this._getStatefulSetsComponent()}
            {this.state.podList && this.state.podList.items && this.state.podList.items.length > 0 && 
                                    this._showComponent(KubeResourceType.Pods) && this.getOrphanPods()}
        </div>);
    }

    private _getFilterBar(): JSX.Element {
        if (this.state.selectedKey === workloadsPivotItemKey) {
            return (<FilterComponent filter={this.state.filter}
                keywordPlaceHolder={Resources.PivotWorkloadsText.toLowerCase()}
                pickListPlaceHolder={Resources.KindText}
                pickListItemsFn={this._pickListItems}
                listItemsFn={this._listItems}
                filterToggled={filterToggled}
            />);
        }
        else {
            return (<FilterComponent filter={this.state.svcFilter}
                pickListPlaceHolder={Resources.TypeText}
                keywordPlaceHolder={Resources.PivotServiceText.toLowerCase()}
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

    private _onDeploymentItemInvoked = (event: React.SyntheticEvent<HTMLElement>, item: IDeploymentItem) => {
        this.setState({
            showDeployment: true,	
            selectedItem: item,	
            showService: false,	
            showSummary: false	
        });
    }

    private _onServiceItemInvoked = (event: React.SyntheticEvent<HTMLElement>, item: IServiceItem) => {
        this.setState({
            showService: true,
            selectedItem: item,
            showDeployment: false,
            showSummary: false
        });
    }

    private _getServiceComponent(): JSX.Element {
        const svc: V1Service = this.state.selectedItem.service;
        //service currently only supports equals with "and" operator. The generator generates that condition.
        const labelSelector: string = Utils.generateEqualsConditionLabelSelector(svc.spec.selector || {});
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
        return <PodsComponent podsToRender={pods} nameFilter={this._getNameFilterKey()}/>;
    }

    private _getDaemonSetsComponent():JSX.Element {
        return (<DaemonSetListingComponent
            daemonSetList={this.state.daemonSetList || {} as V1DaemonSetList}
            key={format("ds-list-{0}", this.state.namespace || "")}
            nameFilter={this._getNameFilterKey()}
        />);
    }

    private _getStatefulSetsComponent(): JSX.Element {
        return (<StatefulSetListingComponent
            statefulSetList={this.state.statefulSetList || {} as V1StatefulSetList}
            key={format("sts-list-{0}", this.state.namespace || "")}
            nameFilter={this._getNameFilterKey()}
        />);
    }

    private _getDeployments(): JSX.Element {
        return (<DeploymentsComponent
            deploymentList={this.state.deploymentList || {} as V1DeploymentList}
            replicaSetList={this.state.replicaSetList || {} as V1ReplicaSetList}
            key={format("dc-{0}", this.state.namespace || "")}
            onItem={this._onDeploymentItemInvoked}
            nameFilter={this._getNameFilterKey()}
        />);
    }

    private _onFilterApplied = (currentState: IFilterState) => {
        this.setState({
            workloadsFilterState: this.state.filter.getState()
        })
    };

    private _onSvcFilterApplied = (currentState: IFilterState) => {
        this.setState({
            svcFilterState: this.state.svcFilter.getState()
        })
    };

    private _getNameFilterKey(): string | undefined {
        const filterState:IFilterState | undefined = this.state.selectedKey===workloadsPivotItemKey?this.state.workloadsFilterState:this.state.svcFilterState;
        const filterItem: IFilterItemState | null= filterState? filterState["nameKey"]: null;
        return filterItem? (filterItem.value as string): undefined;
    }

    private _getTypeSelection():any[] {
        const filterState:IFilterState | undefined = this.state.selectedKey===workloadsPivotItemKey?this.state.workloadsFilterState:this.state.svcFilterState;
        const filterItem: IFilterItemState | null= filterState? filterState["typeKey"]: null;
        const selections: any[] = filterItem? filterItem.value : [];
        return selections;
    }

    private _showComponent(resourceType: KubeResourceType): boolean{
        const selections: KubeResourceType[] = this._getTypeSelection();
        // if no selections are made, show all components
        if(selections.length > 0) {
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

    private _listItems = (item: any)=> {
        let name:string = "";
        switch(item){
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
            default:
                name = "Unknown";
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
}