/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1Pod, V1PodList, V1ReplicaSet } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ILabelModel, LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { css } from "azure-devops-ui/Util";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { IPodListComponentProperties, PodListComponent } from "./PodListComponent";
import { Utils } from "../Utils";

export interface IReplicaSetListComponentProperties extends IVssComponentProperties {
    replicas: { [uid: string]: V1ReplicaSet };
    deployment: V1Deployment;
    podsPromise: Promise<V1PodList>;
}

export interface IReplicaSetListComponentState {
    replicaPods: { [uid: string]: V1Pod[] };
}

export class ReplicaSetListComponent extends BaseComponent<IReplicaSetListComponentProperties, IReplicaSetListComponentState> {
    constructor(props: IReplicaSetListComponentProperties) {
        super(props, {});
        this.state = {
            replicaPods: {}
        };
    }

    public render(): JSX.Element {
        return (
            <div className="rl-main-content">
                {this._getMainHeading()}
                {this._getReplicaSetListView()}
            </div>
        );
    }

    public componentDidMount(): void {
        this._updatePodsIfNeeded();
    }

    private _updatePodsIfNeeded(): void {
        if (this.props.replicas && this.props.podsPromise && !this._havePodsUpdated) {
            this._havePodsUpdated = true;
            this.props.podsPromise.then((podList: V1PodList) => {
                let replicaPods: { [uid: string]: V1Pod[] } = {};
                Object.keys(this.props.replicas).forEach((r: string, index: number) => {
                    // todo :: build a dict and then use it or should we get filtered list?
                    replicaPods[r] = (podList && podList.items || []).filter(pod => {
                        return Utils.isOwnerMatched(pod.metadata, r);
                    });
                });

                this.setState({ replicaPods: replicaPods });
            });
        }
    }

    private _getReplicaSetListView(): JSX.Element[] {
        let replicaSetListView: JSX.Element[] = [];
        if (this.props.replicas) {
            Object.keys(this.props.replicas).forEach((r: string, index: number) => {
                let podListComponentProperties: IPodListComponentProperties = {
                    replicaSet: this.props.replicas[r],
                    pods: this.state.replicaPods[r] || []
                };

                replicaSetListView.push(
                    <div className={css("dc-content", "replica-with-pod-list", index === 0 ? "first-replica" : "")}>
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

    private _havePodsUpdated: boolean = false;
}