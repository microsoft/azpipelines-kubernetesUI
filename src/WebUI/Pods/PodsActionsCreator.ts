/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1PodList } from "@kubernetes/client-node";
import { IKubeService } from "../../Contracts/Contracts";
import { ActionCreatorBase } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { PodsActions } from "./PodsActions";

export class PodsActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "pods-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);
    }

    public getPods(kubeService: IKubeService, labelSelector?: string): void {
        kubeService && kubeService.getPods(labelSelector || undefined).then(podList => {
            this._extendPodMetadataInList(podList);
            if (labelSelector) {
                this._actions.podsFetchedByLabel.invoke({ podsList: podList, labelSelector: labelSelector });
            }
            else {
                this._actions.podsFetched.invoke(podList);
            }
        });
    }

    // getPod() will provide apiVersion for pod also, should we call?
    private _extendPodMetadataInList(podList: V1PodList): void {
        const pods: V1Pod[] = podList && podList.items || [];
        const podsCount: number = pods.length;
        for (let i: number = 0; i < podsCount; i++) {
            const pod: V1Pod = podList.items[i];
            podList.items[i] = {
                apiVersion: pod.apiVersion || podList.apiVersion,
                kind: pod.kind || "Pod",
                ...pod
            };
        }
    }

    private _actions: PodsActions;
}