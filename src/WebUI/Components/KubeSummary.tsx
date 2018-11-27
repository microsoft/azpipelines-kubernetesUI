import * as React from "react";

import { BaseComponent } from "@uifabric/utilities";

import { PodListComponent } from "./PodListComponent";
import { IKubeService } from "../../Contracts/Contracts";
import { ServiceListComponent } from "./ServiceListComponent";
import { DeploymentListComponent } from "./DeploymentListComponent";
import { ReplicasetListComponent } from "./ReplicasetListComponent";
import { IKubernetesSummary, IVssComponentProperties } from "../Types";
import { convertPodsForComponent, convertDeploymentsForComponent, convertReplicasetsForComponent, convertServicesForComponent } from "../Utilities";

import "../KubeSummary.scss";

export interface IKubernetesContainerState extends IKubernetesSummary {
    namespace?: string;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    kubeService: IKubeService;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState>{
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        this.state = {};
    }

    public componentDidMount(): void {
        this._populateStateData();
    }

    public render(): React.ReactNode {
        return (
            <div className={"kubernetes-container"}>
                <h2 className={"heading"}>namespace: {this.state.namespace || ""}</h2>
                <PodListComponent pods={this.state.pods || []} />
                <DeploymentListComponent deployments={this.state.deployments || []} />
                <ReplicasetListComponent replicasets={this.state.replicasets || []} />
                <ServiceListComponent services={this.state.services || []} />
            </div >
        );
    }

    private _populateStateData(): void {
        let kubeService: IKubeService = this.props.kubeService as IKubeService;
        if (!kubeService) {
            return;
        }

        kubeService.getPods().then(pods => {
            let podNamespace: string = "";
            for (const pod of (pods && pods.items || [])) {
                if (pod && pod.metadata && pod.metadata.namespace) {
                    podNamespace = pod.metadata.namespace;
                    break;
                }
            }

            this.setState({ pods: convertPodsForComponent(pods), namespace: podNamespace });
        });

        kubeService.getDeployments().then(deployments => {
            this.setState({ deployments: convertDeploymentsForComponent(deployments) });
        });

        kubeService.getReplicasets().then(replicasets => {
            this.setState({ replicasets: convertReplicasetsForComponent(replicasets) });
        });

        kubeService.getServices().then(services => {
            this.setState({ services: convertServicesForComponent(services) });
        });
    }
}