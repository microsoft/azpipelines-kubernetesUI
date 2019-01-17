/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList, V1DaemonSetList, V1StatefulSetList, V1Service, V1PodList, V1Pod } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IKubernetesSummary, IVssComponentProperties } from "../Types";
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
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";

export interface IKubernetesContainerState extends IKubernetesSummary {
    selectedKey?: string;
    showSummary?: boolean;
    showDeployment?: boolean;
    showService?: boolean;
    selectedItem?: any;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        this.state = {
            namespace: this.props.namespace || "",
            selectedKey: workloadsPivotItemKey,
            showSummary: true,
            showDeployment: false,
            showService: false
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
                <Pivot
                    selectedKey={this.state.selectedKey}
                    onLinkClick={(item) => this.setState({ selectedKey: item && item.props.itemKey })}
                    className="pivot-main"
                >
                    {this._getDeploymentPivot()}
                    {this._getServicesPivot()}
                </Pivot>
            </div>
        );
    }

    private _getDeploymentPivot(): JSX.Element {
        //todo: adding top margin between each listing components
        return (
            <PivotItem
                headerText={Resources.PivotWorkloadsText}
                itemKey={workloadsPivotItemKey}
                className="item-padding"
            >
                <DeploymentsComponent
                    deploymentList={this.state.deploymentList || {} as V1DeploymentList}
                    replicaSetList={this.state.replicaSetList || {} as V1ReplicaSetList}
                    key={format("dc-{0}", this.state.namespace || "")}
                    onItemActivated={this._onDeploymentItemInvoked}
                />
                <DaemonSetListingComponent
                    daemonSetList={this.state.daemonSetList || {} as V1DaemonSetList}
                    key={format("ds-list-{0}", this.state.namespace || "")}
                />
                <StatefulSetListingComponent
                    statefulSetList={this.state.statefulSetList || {} as V1StatefulSetList}
                    key={format("sts-list-{0}", this.state.namespace || "")}
                />

                {this.state.podList && this.state.podList.items && this.state.podList.items.length > 0 && this.getOrphanPods()}
            </PivotItem>
        );
    }

    private _onDeploymentItemInvoked = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        // TODO: Handle this after we introduce flux structure, as this requires selected DeploymentItem information which exists only with DeploymentsComponent as of now
    }

    private _getServicesPivot(): JSX.Element {
        return (
            <PivotItem
                headerText={Resources.PivotServiceText}
                itemKey={servicesPivotItemKey}
                className="item-padding"
            >
                <ServicesComponent
                    servicesList={this.state.serviceList || {} as V1ServiceList}
                    onItemActivated={this._onServiceItemInvoked}
                />
            </PivotItem>
        );
    }

    private _onServiceItemInvoked = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.state.serviceList) {
            const serviceItems = ServicesComponent.getServiceItems(this.state.serviceList);
            const selectedItem = serviceItems[tableRow.index];
            this.setState({
                showService: true,
                selectedItem: selectedItem,
                showDeployment: false,
                showSummary: false
            });
        }
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
        return <PodsComponent podsToRender={pods} />;
    }
}