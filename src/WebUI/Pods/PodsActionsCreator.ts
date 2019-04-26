/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1PodList, V1ListMeta } from "@kubernetes/client-node";
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

    public getPods(kubeService: IKubeService, labelSelector?: string, fetchByLabel: boolean = false): void {
        if (fetchByLabel && !labelSelector) {
            // For service's associated pods, fetchByLabel is true; In this scenario if no label selector is supplied, it implies zero pods
            const podList: V1PodList = {
                apiVersion: "",
                items: [],
                kind: "",
                metadata: {} as V1ListMeta
            };
            // Calling action inside timeout to ensure the action listener is initialized in the ServiceDetails
            setTimeout(() => this._actions.podsFetchedByLabel.invoke({ podsList: podList, labelSelector: "", isLoading: false }));
        }
        else {
            kubeService && kubeService.getPods(labelSelector || undefined).then(podList => {
                this._extendPodMetadataInList(podList);
                if (labelSelector) {
                    this._actions.podsFetchedByLabel.invoke({ podsList: podList, labelSelector: labelSelector, isLoading: false });
                }
                else {
                    this._actions.podsFetched.invoke({ podsList: podList, isLoading: false });
                }
            });
        }
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