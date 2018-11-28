import "./KubeSummary.scss";

import * as React from "react";
import { BaseComponent, format } from "@uifabric/utilities";
import { IKubeService } from "../../Contracts/Contracts";
import { IKubernetesSummary, IVssComponentProperties, IService } from "../Types";
import { DeploymentsComponent } from "./DeploymentsComponent";
import { V1DeploymentList, V1ReplicaSetList, V1ServiceList } from "@kubernetes/client-node";
import * as Resources from "../Resources";
import { Pivot, PivotItem } from "office-ui-fabric-react/lib/Pivot";
import { ServiceListComponent } from "./ServiceListComponent";
import { convertServicesForComponent } from "../Utilities";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";

export interface IKubernetesContainerState extends IKubernetesSummary {
    selectedKey?: string;
}

export interface IKubeSummaryProps extends IVssComponentProperties {
    title: string;
    kubeService: IKubeService;
    namespace?: string;
}

export class KubeSummary extends BaseComponent<IKubeSummaryProps, IKubernetesContainerState> {
    constructor(props: IKubeSummaryProps) {
        super(props, {});
        this.state = { namespace: this.props.namespace || "", selectedKey: workloadsPivotItemKey };
    }

    public componentDidMount(): void {
        this._populateStateData();
    }

    public render(): React.ReactNode {
        return (
            <div className={"kubernetes-container"}>
                <div className="content-main-heading">
                    <h2 className="heading">{this.props.title}</h2>
                    <div className={"sub-heading"}>{format(Resources.NamespaceHeadingText, this.state.namespace || "")}</div>
                </div>
                <div className="content-with-pivot">
                    <Pivot
                        selectedKey={this.state.selectedKey}
                        onLinkClick={(item) => this.setState({ selectedKey: item && item.props.itemKey })}
                        className="pivot-main"
                    >
                        <PivotItem
                            headerText={Resources.PivotWorkloadsText}
                            itemKey={workloadsPivotItemKey}
                            className="item-padding"
                        >
                            <DeploymentsComponent
                                deploymentList={this.state.deploymentList || {} as V1DeploymentList}
                                replicaSetList={this.state.replicaSetList || {} as V1ReplicaSetList}
                                key={format("dc-{0}", this.state.namespace || "")}
                            />
                        </PivotItem>
                        <PivotItem
                            headerText={Resources.PivotServiceText}
                            itemKey={servicesPivotItemKey}
                            className="item-padding"
                        >
                            {/* todo :: delete these entries in future -- begin -- */}
                            <ServiceListComponent services={this._getServices()} />
                            {/* -- end -- */}
                        </PivotItem>
                    </Pivot>
                </div >
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

    // todo :: should remove in future
    private _getServices(): IService[] {
        return this.state.serviceList && this.state.serviceList.items
            ? convertServicesForComponent(this.state.serviceList || {} as V1ServiceList)
            : [];
    }
}