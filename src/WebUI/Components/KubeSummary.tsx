import "./KubeSummary.scss";

import * as React from "react";

import { BaseComponent, format } from "@uifabric/utilities";

import { PodListComponent } from "./PodListComponent";
import { IKubeService } from "../../Contracts/Contracts";
import { ServiceListComponent } from "./ServiceListComponent";
import { DeploymentListComponent } from "./DeploymentListComponent";
import { ReplicasetListComponent } from "./ReplicasetListComponent";
import { IKubernetesSummary, IVssComponentProperties, IDeployment, IReplicaset, IPod, IService } from "../Types";
import {
    convertDeploymentsForComponent,
    convertPodsForComponent,
    convertReplicaSetsForComponent,
    convertServicesForComponent
} from "../Utilities";
import { DeploymentsComponent } from "./DeploymentsComponent";
import { V1DeploymentList, V1PodList, V1ReplicaSetList, V1SecretList, V1ServiceList } from "@kubernetes/client-node";

export interface IKubernetesContainerState extends IKubernetesSummary {
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        this.state = { namespace: this.props.namespace || "" };
    }

    public componentDidMount(): void {
        this._populateStateData();
    }

    public render(): React.ReactNode {
        return (
            <div className={"kubernetes-container"}>
                <h2 className={"heading"}>namespace: {this.state.namespace || ""}</h2>
                <DeploymentsComponent
                    deploymentList={this.state.deploymentList || {} as V1DeploymentList}
                    replicaSetList={this.state.replicaSetList || {} as V1ReplicaSetList}
                    key={format("dc-{0}", this.state.namespace || "")}
                />
                {/* todo :: delete these entries in future -- begin -- */}
                <PodListComponent pods={this._getPods()} />
                <DeploymentListComponent deployments={this._getDeployments()} />
                <ReplicasetListComponent replicasets={this._getReplicaSets()} />
                <ServiceListComponent services={this._getServices()} />
                {/* -- end -- */}
            </div >
        );
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
            if (this.state.namespace) {
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

    // todo :: should remove in future
    private _getPods(): IPod[] {
        return this.state.podList && this.state.podList.items
            ? convertPodsForComponent(this.state.podList || {} as V1PodList)
            : [];
    }

    // todo :: should remove in future
    private _getDeployments(): IDeployment[] {
        return this.state.deploymentList && this.state.deploymentList.items
            ? convertDeploymentsForComponent(this.state.deploymentList || {} as V1DeploymentList)
            : [];
    }

    // todo :: should remove in future
    private _getReplicaSets(): IReplicaset[] {
        return this.state.replicaSetList && this.state.replicaSetList.items
            ? convertReplicaSetsForComponent(this.state.replicaSetList || {} as V1ReplicaSetList)
            : [];
    }

    // todo :: should remove in future
    private _getServices(): IService[] {
        return this.state.serviceList && this.state.serviceList.items
            ? convertServicesForComponent(this.state.serviceList || {} as V1ServiceList)
            : [];
    }
}