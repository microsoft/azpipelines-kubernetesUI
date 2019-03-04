/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase, Action } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { IKubeService } from "../../Contracts/Contracts";
import { WorkloadsActions } from "./WorkloadsActions";

export class WorkloadsActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "workloads-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<WorkloadsActions>(WorkloadsActions);
    }

    public getDeployments(kubeService: IKubeService): void {
        kubeService.getDeployments().then(deploymentList => {
            this._actions.deploymentsFetched.invoke(deploymentList);
        });
    }

    public getReplicaSets(kubeService: IKubeService): void {
        kubeService.getReplicaSets().then(replicaSetsList => {
            this._actions.replicaSetsFetched.invoke(replicaSetsList);
        });
    }

    public getDaemonSets(kubeService: IKubeService): void {
        kubeService.getDaemonSets().then(daemonSetsList => {
            this._actions.daemonSetsFetched.invoke(daemonSetsList);
        });
    }

    public getStatefulSets(kubeService: IKubeService): void {
        kubeService.getStatefulSets().then(statefulSetsList => {
            this._actions.statefulSetsFetched.invoke(statefulSetsList);
        });
    }

    public getPods(kubeService: IKubeService): void {
        kubeService.getPods().then(podsList => {
            this._actions.podsFetched.invoke(podsList);
        });
    }

    private _actions: WorkloadsActions;
}

