/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSetList, V1ServiceList } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IKubernetesSummary, IReplicaSetPodItems, IVssComponentProperties } from "../Types";
import { DeploymentsComponent } from "./DeploymentsComponent";
import "./KubeSummary.scss";
import { IReplicaSetListComponentProperties, ReplicaSetListComponent } from "./ReplicaSetListComponent";
import { ServicesComponent } from "./ServicesComponent";

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
                    <div>Show service</div>
                }
            </div >
        );
    }

    private _getReplicaSetPodListComponent(): JSX.Element | null {
        if (this.state.selectedItem) {
            const replicaSets = (this.state.replicaSetList && this.state.replicaSetList.items || []).filter(replica => {
                return replica.metadata.ownerReferences
                    && replica.metadata.ownerReferences.length > 0
                    && replica.metadata.ownerReferences[0].uid.toLowerCase() === this.state.selectedItem.uid.toLowerCase();
            });

            if (replicaSets) {
                let replicaDict: { [uid: string]: IReplicaSetPodItems } = {};
                replicaSets.forEach(replica => {
                    const replicaUId = replica.metadata.uid.toLowerCase();
                    const filteredPods = (this.state.podList && this.state.podList.items || []).filter(pod => {
                        return pod.metadata.ownerReferences
                            && pod.metadata.ownerReferences.length > 0
                            && pod.metadata.ownerReferences[0].uid.toLowerCase() === replicaUId
                    });

                    replicaDict[replicaUId] = { replicaSet: replica, pods: filteredPods };
                });


                const replicaSetList: IReplicaSetListComponentProperties = {
                    replicaPodSets: replicaDict,
                    deployment: this.state.selectedItem.deployment
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

        kubeService.getPods().then(podList => {
            this.setState({ podList: podList });
        });

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
                    onItemInvoked={this._onItemInvoked}
                />
            </PivotItem>
        );
    }

    private _onItemInvoked = (item?: any, index?: number, ev?: Event) => {
        this.setState({
            showDeployment: true,
            showService: false,
            showSummary: false,
            selectedItem: item
        });
    }

    private _getServicesPivot(): JSX.Element {
        return (
            <PivotItem
                headerText={Resources.PivotServiceText}
                itemKey={servicesPivotItemKey}
                className="item-padding"
            >
                <ServicesComponent servicesList={this.state.serviceList || {} as V1ServiceList} />
            </PivotItem>
        );
    }
}