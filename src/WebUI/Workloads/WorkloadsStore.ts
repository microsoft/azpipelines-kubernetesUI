/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSetList, V1DeploymentList, V1Pod, V1ReplicaSetList, V1StatefulSetList } from "@kubernetes/client-node";
import { WorkloadsEvents } from "../Constants";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { StoreBase } from "../FluxCommon/Store";
import { IPodsPayload, PodsActions } from "../Pods/PodsActions";
import { WorkloadsActions } from "./WorkloadsActions";
import { Utils } from "../Utils";

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

        this._state = { deploymentNamespace: "", deploymentList: undefined, replicaSetList: undefined, daemonSetList: undefined, statefulSetList: undefined, orphanPodsList: undefined };

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
        return (this._state.deploymentList ? (this._state.deploymentList.items || []).length : 0) +
            (this._state.replicaSetList ? (this._state.replicaSetList.items || []).length : 0) +
            (this._state.daemonSetList ? (this._state.daemonSetList.items || []).length : 0) +
            (this._state.statefulSetList ? (this._state.statefulSetList.items || []).length : 0) +
            (this._state.orphanPodsList ? (this._state.orphanPodsList || []).length : 0);
    }

    private _setDeploymentsList = (deploymentsList: V1DeploymentList): void => {
        const _stateItems = this._state.deploymentList ? this._state.deploymentList.items : [];
        const _deploymentItems = deploymentsList ? deploymentsList.items : [];
        const isEquals = Utils.isDeepEquals(_stateItems, _deploymentItems);
        if (!isEquals || !this._state.deploymentList) {
            this._state.deploymentList = deploymentsList;
            const deploymentItems = deploymentsList ? deploymentsList.items || [] : [];
            for (const deployment of deploymentItems) {
                if (deployment && deployment.metadata && deployment.metadata.namespace) {
                    this._state.deploymentNamespace = deployment.metadata.namespace;
                    break;
                }
            }
            this.emit(WorkloadsEvents.DeploymentsFetchedEvent, this);
        }
        if (this._state.deploymentList && this._state.deploymentList.items && this._state.deploymentList.items.length > 0) {
            this.emit(WorkloadsEvents.WorkloadsFoundEvent, this);
        }
        else {
            this.emit(WorkloadsEvents.ZeroDeploymentsFoundEvent, this);
        }
    }

    private _setReplicaSetsList = (replicaSetList: V1ReplicaSetList): void => {
        const _stateItems = this._state.replicaSetList ? this._state.replicaSetList.items : [];
        const _replicaItems = replicaSetList ? replicaSetList.items : [];
        const isEquals = Utils.isDeepEquals(_stateItems, _replicaItems);
        if (!isEquals || !this._state.replicaSetList) {
            this._state.replicaSetList = replicaSetList;
            this.emit(WorkloadsEvents.ReplicaSetsFetchedEvent, this);
        }
        if (this._state.replicaSetList && this._state.replicaSetList.items && this._state.replicaSetList.items.length > 0) {
            this.emit(WorkloadsEvents.WorkloadsFoundEvent, this);
        }
    }

    private _setDaemonSetsList = (daemonSetList: V1DaemonSetList): void => {
        const _stateItems = this._state.daemonSetList ? this._state.daemonSetList.items : [];
        const _daemonSetItems = daemonSetList ? daemonSetList.items : [];
        const isEquals = Utils.isDeepEquals(_stateItems, _daemonSetItems);
        if (!isEquals || !this._state.daemonSetList) {
            this._state.daemonSetList = daemonSetList;
            this.emit(WorkloadsEvents.DaemonSetsFetchedEvent, this);
        }
        if (this._state.daemonSetList && this._state.daemonSetList.items && this._state.daemonSetList.items.length > 0) {
            this.emit(WorkloadsEvents.WorkloadsFoundEvent, this);
        }
    }

    private _setStatefulsetsList = (statefulSetList: V1StatefulSetList): void => {
        const _stateItems = this._state.statefulSetList ? this._state.statefulSetList.items : [];
        const _stateFulSetItems = statefulSetList ? statefulSetList.items : [];
        const isEquals = Utils.isDeepEquals(_stateItems, _stateFulSetItems);
        //if this is the first call or empty data
        if (!isEquals || !this._state.statefulSetList) {
            this._state.statefulSetList = statefulSetList;
            this.emit(WorkloadsEvents.StatefulSetsFetchedEvent, this);
        }
        if (this._state.statefulSetList && this._state.statefulSetList.items && this._state.statefulSetList.items.length > 0) {
            this.emit(WorkloadsEvents.WorkloadsFoundEvent, this);
        }
    }

    private _setOrphanPodsList = (payload: IPodsPayload): void => {
        let orphanPods: V1Pod[] = [];
        payload.podsList && payload.podsList.items && payload.podsList.items.forEach(pod => {
            if (!pod.metadata.ownerReferences) {
                orphanPods.push(pod);
            }
        });
        const isEquals = Utils.isDeepEquals(this._state.orphanPodsList || [], orphanPods);
        if (!isEquals || !this._state.orphanPodsList) {
            this._state.orphanPodsList = orphanPods;
            this.emit(WorkloadsEvents.WorkloadPodsFetchedEvent, this);
        }
        if (this._state.orphanPodsList && this._state.orphanPodsList.length > 0) {
            this.emit(WorkloadsEvents.WorkloadsFoundEvent, this);
        }
    }

    private _state: IWorkloadsStoreState;
    private _workloadActions: WorkloadsActions;
    private _podsActions: PodsActions;
}

