import React = require("react");
import { BaseComponent, format } from "@uifabric/utilities";
import { IVssComponentProperties, IReplicaSetPodItems } from "../Types";
import { V1Pod, V1ReplicaSet, V1Deployment } from "@kubernetes/client-node";
import { PodListComponent, IPodListComponentProperties } from "./PodListComponent";
import { ILabelModel, LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { css } from "azure-devops-ui/Util";
import * as Resources from "../Resources";

export interface IReplicaSetListComponentProperties extends IVssComponentProperties {
    replicaPodSets: { [uid: string]: IReplicaSetPodItems };
    deployment: V1Deployment;
}

export class ReplicaSetListComponent extends BaseComponent<IReplicaSetListComponentProperties> {
    public render(): JSX.Element {
        return (
            <div className="rl-main-content">
                {this._getMainHeading()}
                {this._getReplicaSetListView()}
            </div>
        );
    }

    private _getReplicaSetListView(): JSX.Element[] {
        let replicaSetListView: JSX.Element[] = [];
        if (this.props.replicaPodSets) {
            Object.keys(this.props.replicaPodSets).forEach((r: string) => {
                const replicaSetPods = this.props.replicaPodSets[r];
                let podListComponentProperties: IPodListComponentProperties = {
                    replicaSet: replicaSetPods.replicaSet,
                    pods: replicaSetPods.pods
                };

                replicaSetListView.push(
                    <div className={css("dc-content", "depth-16", "pod-list")}>
                        <PodListComponent {...podListComponentProperties} />
                    </div>
                );
            });
        }

        return replicaSetListView;
    }

    private _getMainHeading(): JSX.Element | null {
        if (this.props.deployment && this.props.deployment.metadata) {
            const deploymentHeading = format(Resources.Deployment, this.props.deployment.metadata.name);
            return (
                <div className="content-main-heading">
                    <h2 className="title-heading">{deploymentHeading}</h2>
                    {this._getDeploymentLabels()}
                </div>
            );
        }
        return null;
    }

    // todo :: refactor as util function to use in deployment and replicaset
    private _getDeploymentLabels(): React.ReactNode | null {
        if (this.props.deployment
            && this.props.deployment.metadata
            && this.props.deployment.metadata.labels) {
            const deploymentLabels = this.props.deployment.metadata.labels;
            let labels = new ObservableArray<ILabelModel>();
            Object.keys(deploymentLabels).forEach((key: string) => {
                labels.push({ content: format("{0}:{1}", key, deploymentLabels[key]) });
            });

            return <LabelGroup labelProps={labels} wrappingBehavior={WrappingBehavior.FreeFlow} fadeOutOverflow />;
        }

        return null;
    }
}