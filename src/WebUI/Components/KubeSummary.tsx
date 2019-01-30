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
import { IKubernetesSummary, IVssComponentProperties, IServiceItem, IDeploymentReplicaSetItem } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsComponent } from "./DeploymentsComponent";
import "./KubeSummary.scss";
import { IReplicaSetListComponentProperties, ReplicaSetListComponent } from "./ReplicaSetListComponent";
import { PodsViewComponent } from "./PodsViewComponent";
import { ServiceComponent } from "./ServiceComponent";
import { ServicesComponent } from "./ServicesComponent";
// todo :: work around till this issue is fixed in devops ui
import "azure-devops-ui/Label.scss";
import { DaemonSetListComponent } from "./DaemonSetListComponent";
import { StatefulSetListingComponent } from "./StatefulSetListingComponent";
import { PodsComponent } from "./PodsComponent";
import { ZeroDataComponent } from "./ZeroDataComponent";
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
                    this._getReplicaSetPodDetails()
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
            const selectedItemUId: string = selectedItem.deploymentId.toLowerCase();
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

    private _getReplicaSetPodDetails(): JSX.Element | null {
        const selectedItem = this.state.selectedItem;
        if (selectedItem) {
            const selectedItemDeploymentUId: string = selectedItem.deploymentId.toLowerCase();
            const selectedItemReplicaSetUId: string = selectedItem.replicaSetId.toLowerCase();
            const replicas = this.state.replicaSetList;
            const filteredReplicas = (replicas && replicas.items || []).filter(replica => {
                return Utils.isOwnerMatched(replica.metadata, selectedItemDeploymentUId) && replica.metadata.uid.toLowerCase() === selectedItemReplicaSetUId;
            });

            if (filteredReplicas) {
                return (<PodsViewComponent
                    parentMetaData={filteredReplicas[0].metadata}
                    podTemplate={filteredReplicas[0].spec && filteredReplicas[0].spec.template}
                    parentKind={selectedItem.kind || "ReplicaSet"}
                    podsPromise={this.props.kubeService && this.props.kubeService.getPods() || Promise.resolve({})} />);
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
                {(this._getWorkloadSize()+ (this.state.serviceList ? this.state.serviceList.items.length : 0)) > 0 ?
                    this._getMainPivot() :
                    <ZeroDataComponent
                        imagePath={require("../zero_data.png")}
                        hyperLink="https://kubernetes.io/docs/concepts/workloads/pods/pod/"
                        hyperLinkLabel={Resources.LearnMoreText}
                        descriptionText={Resources.NoWorkLoadsText}
                        additionalHelpText={Resources.CreateWorkLoadText}
                    />}
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
        if (this._getWorkloadSize() === 0) {
            return (
                <PivotItem
                    headerText={Resources.PivotWorkloadsText}
                    itemKey={workloadsPivotItemKey}
                    className="item-padding"
                >
                    <ZeroDataComponent
                        imagePath={require("../zero_data.png")}
                        hyperLink="https://kubernetes.io/docs/concepts/workloads/pods/pod/"
                        hyperLinkLabel={Resources.LearnMoreText}
                        descriptionText={Resources.NoWorkLoadsText}
                        additionalHelpText={Resources.CreateWorkLoadText}
                    />

                </PivotItem>
            );
        }
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
                <DaemonSetListComponent
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

    private _onDeploymentItemInvoked = (event: React.SyntheticEvent<HTMLElement>, item: IDeploymentReplicaSetItem) => {
        this.setState({
            showDeployment: true,
            selectedItem: item,
            showService: false,
            showSummary: false
        });
    }

    private _getServicesPivot(): JSX.Element {
        const serivceSize: number = this.state.serviceList ? this.state.serviceList.items.length : 0;
        return (
            <PivotItem
                headerText={Resources.PivotServiceText}
                itemKey={servicesPivotItemKey}
                className="item-padding"
            >{
                    serivceSize == 0 ? <ZeroDataComponent
                        imagePath={require("../zero_data.png")}
                        hyperLink="https://kubernetes.io/docs/concepts/services-networking/service/"
                        hyperLinkLabel={Resources.LearnMoreText}
                        descriptionText={Resources.NoServicesText}
                        additionalHelpText={Resources.CreateServiceText}
                    /> :
                        <ServicesComponent
                            servicesList={this.state.serviceList || {} as V1ServiceList}
                            onItemActivated={this._onServiceItemInvoked}
                        />
                }
            </PivotItem>
        );
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
        return <PodsComponent podsToRender={pods} />;
    }

    private _getWorkloadSize(): number {
        return  (this.state.deploymentList ? this.state.deploymentList.items.length : 0) +
            (this.state.replicaSetList ? this.state.replicaSetList.items.length : 0) +
            (this.state.daemonSetList ? this.state.daemonSetList.items.length : 0 ) +
            (this.state.statefulSetList ? this.state.statefulSetList.items.length : 0 ) +
            (this.state.podList ? this.state.podList.items.length : 0 ) ;
    }
}