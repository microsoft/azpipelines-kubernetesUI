/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { StoreBase } from "../FluxCommon/Store";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1DaemonSetList, V1StatefulSetList, V1PodList, V1Pod, V1DaemonSet, V1StatefulSet, V1PodTemplateSpec, V1ObjectMeta } from "@kubernetes/client-node";
import { WorkloadsActions } from "./WorkloadsActions";
import { PodsActions } from "../Pods/PodsActions";
import { WorkloadsEvents } from "../Constants";

export interface IWorkloadsStoreState {
    deploymentNamespace?: string;
    deploymentList?: V1DeploymentList;
    replicaSetList?: V1ReplicaSetList;
    daemonSetList?: V1DaemonSetList;
    statefulSetList?: V1StatefulSetList;
    orphanPodsList?: V1Pod[];
}

export class WorkloadsStore extends StoreBase {
    public static getKey(): string {
        return "workloads-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._state = { deploymentNamespace: "", deploymentList: undefined, replicaSetList: undefined, daemonSetList: undefined, statefulSetList: undefined, orphanPodsList: [] };

        this._workloadActions = ActionsHubManager.GetActionsHub<WorkloadsActions>(WorkloadsActions);
        this._podsActions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);

        this._workloadActions.deploymentsFetched.addListener(this._setDeploymentsList);
        this._workloadActions.replicaSetsFetched.addListener(this._setReplicaSetsList);
        this._workloadActions.daemonSetsFetched.addListener(this._setDaemonSetsList);
        this._workloadActions.statefulSetsFetched.addListener(this._setStatefulsetsList);
        this._podsActions.podsFetched.addListener(this._setOrphanPodsList);
    }

    public disposeInternal(): void {
        this._workloadActions.deploymentsFetched.removeListener(this._setDeploymentsList);
        this._workloadActions.replicaSetsFetched.removeListener(this._setReplicaSetsList);
        this._workloadActions.daemonSetsFetched.removeListener(this._setDaemonSetsList);
        this._workloadActions.statefulSetsFetched.removeListener(this._setStatefulsetsList);
        this._podsActions.podsFetched.removeListener(this._setOrphanPodsList);
    }

    public getState(): IWorkloadsStoreState {
        return this._state;
    }

    public getWorkloadSize(): number {
        return (this._state.deploymentList ? this._state.deploymentList.items.length : 0) +
            (this._state.replicaSetList ? this._state.replicaSetList.items.length : 0) +
            (this._state.daemonSetList ? this._state.daemonSetList.items.length : 0) +
            (this._state.statefulSetList ? this._state.statefulSetList.items.length : 0) +
            (this._state.orphanPodsList ? this._state.orphanPodsList.length : 0);
    }

    private _setDeploymentsList = (deploymentsList: V1DeploymentList): void => {
        this._state.deploymentList = deploymentsList;
        for (const deployment of (deploymentsList && deploymentsList.items || [])) {
            if (deployment && deployment.metadata.namespace) {
                this._state.deploymentNamespace = deployment.metadata.namespace;
                break;
            }
        }

        this.emit(WorkloadsEvents.DeploymentsFetchedEvent, this);

        if (!this._state.deploymentList || !this._state.deploymentList.items || this._state.deploymentList.items.length <= 0) {
            this.emit(WorkloadsEvents.ZeroWorkloadsFoundEvent, this);
        }
    }

    private _setReplicaSetsList = (replicaSetList: V1ReplicaSetList): void => {
        this._state.replicaSetList = replicaSetList;
        this.emit(WorkloadsEvents.ReplicaSetsFetchedEvent, this);
        if (!this._state.replicaSetList || !this._state.replicaSetList.items || this._state.replicaSetList.items.length <= 0) {
            this.emit(WorkloadsEvents.ZeroWorkloadsFoundEvent, this);
        }
    }

    private _setDaemonSetsList = (daemonSetList: V1DaemonSetList): void => {
        this._state.daemonSetList = daemonSetList;
        this.emit(WorkloadsEvents.DaemonSetsFetchedEvent, this);
        if (!this._state.daemonSetList || !this._state.daemonSetList.items || this._state.daemonSetList.items.length <= 0) {
            this.emit(WorkloadsEvents.ZeroWorkloadsFoundEvent, this);
        }
    }

    private _setStatefulsetsList = (statefulSetList: V1StatefulSetList): void => {
        this._state.statefulSetList = statefulSetList;
        this.emit(WorkloadsEvents.StatefulSetsFetchedEvent, this);
        if (!this._state.statefulSetList || !this._state.statefulSetList.items || this._state.statefulSetList.items.length <= 0) {
            this.emit(WorkloadsEvents.ZeroWorkloadsFoundEvent, this);
        }
    }

    private _setOrphanPodsList = (podsList: V1PodList): void => {
        let orphanPods: V1Pod[] = [];
        podsList && podsList.items && podsList.items.forEach(pod => {
            if (!pod.metadata.ownerReferences) {
                orphanPods.push(pod);
            }
        });

        this._state.orphanPodsList = orphanPods;
        if (!this._state.orphanPodsList || this._state.orphanPodsList.length <= 0) {
            this.emit(WorkloadsEvents.ZeroWorkloadsFoundEvent, this);
        }
    }

    private _state: IWorkloadsStoreState;
    private _workloadActions: WorkloadsActions;
    private _podsActions: PodsActions;
}

