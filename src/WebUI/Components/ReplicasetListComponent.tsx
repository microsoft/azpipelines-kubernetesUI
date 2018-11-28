import React = require("react");
import { BaseComponent, format } from "@uifabric/utilities";
import { IVssComponentProperties } from "../Types";
import * as Resources from "../Resources";
import { V1Pod, V1ReplicaSet, V1Deployment } from "@kubernetes/client-node";
import { PodListComponent, IPodListComponentProperties } from "./PodListComponent";
import { ILabelModel, LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { css } from "azure-devops-ui/Util";

export interface IReplicaSetListComponentProperties extends IVssComponentProperties {
    replicaPodSets: { [uid: string]: { replicaSet: V1ReplicaSet, pods: V1Pod[] } };
    deployment: V1Deployment;
}

export class ReplicaSetListComponent extends BaseComponent<IReplicaSetListComponentProperties> {
    public render(): JSX.Element {
        return (
            <div>
                {this._getMainHeading()}
                {this._getReplicaSetListView()}
            </div>
        );
    }

    private _getReplicaSetListView(): JSX.Element[] {
        let replicaSetListView: JSX.Element[] = [];
        if (this.props.replicaPodSets) {
            Object.keys(this.props.replicaPodSets).forEach((r: string) => {
                var replicaSetPods = this.props.replicaPodSets[r];
                let podListComponentProperties: IPodListComponentProperties = {
                    replicaSet: replicaSetPods.replicaSet,
                    pods: replicaSetPods.pods
                };
                console.log(podListComponentProperties);
                replicaSetListView.push(<div className={css("dc-content", "depth-16", "pod-list")}><PodListComponent {...podListComponentProperties} /></div>);
            });
        }

        return replicaSetListView;
    }

    private _getMainHeading(): JSX.Element | null {
        if (this.props.deployment && this.props.deployment.metadata) {
            return (
                <div className="content-main-heading">
                    <h2 className="heading">{this.props.deployment.metadata.name}</h2>
                    {this._getReplicaSetAnnotations()}
                </div>
            );
        }
        return null;
    }

    private _getReplicaSetAnnotations(): React.ReactNode | null {
        if (this.props.deployment
            && this.props.deployment.metadata
            && this.props.deployment.metadata.labels) {
            var deploymentLabels = this.props.deployment.metadata.labels;
            var labels = new ObservableArray<ILabelModel>();
            Object.keys(deploymentLabels).forEach((key: string) => {
                labels.push({ content: format("{0}:{1}", key, deploymentLabels[key]) });
            });

            return (<LabelGroup labelProps={labels} wrappingBehavior={WrappingBehavior.FreeFlow} fadeOutOverflow />);
        }

        return null;
    }
}