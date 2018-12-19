/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1PodStatus } from "@kubernetes/client-node";
import { format } from "@uifabric/utilities/lib";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ILabelModel } from "azure-devops-ui/Label";
import { Statuses, IStatusProps } from "azure-devops-ui/Status";

/**
 * https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase
 */
export enum PodPhase {
    Pending = "Pending",
    Running = "Running",
    Succeeded = "Succeeded",
    Failed = "Failed",
    Unknown = "Unknown"
}

export class Utils {
    public static isOwnerMatched(objectMeta: V1ObjectMeta, ownerUIdLowerCase: string): boolean {
        return objectMeta.ownerReferences
            && objectMeta.ownerReferences.length > 0
            && objectMeta.ownerReferences[0].uid.toLowerCase() === ownerUIdLowerCase;
    }

    public static getUILabelModelArray(items: { [key: string]: string }): ObservableArray<ILabelModel> {
        let labelArray = new ObservableArray<ILabelModel>();
        if (items) {
            Object.keys(items).forEach((key: string) => {
                labelArray.push({ content: format("{0}={1}", key, items[key]) });
            });
        }

        return labelArray;
    }

    public static generateEqualsConditionLabelSelector(labels: { [key: string]: string }): string {
        console.log(labels);
        let labelSelector: string = "";
        if(labels) {
            const keySet = Object.keys(labels);
            keySet.forEach((key,index) => {
                labelSelector = labelSelector.concat(format("{0}={1}", key, labels[key]))
                if (index < keySet.length-1) labelSelector = labelSelector.concat(",");
            });
        }
        return labelSelector;
    }

    public static generatePodStatusProps(status:V1PodStatus): IStatusProps {
        if(status.phase === PodPhase.Running|| status.phase === PodPhase.Succeeded){
                return Statuses.Success;
        } 
        return Statuses.Failed;
    }
}