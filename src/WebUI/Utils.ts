/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta } from "@kubernetes/client-node";
import { format } from "@uifabric/utilities/lib";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ILabelModel } from "azure-devops-ui/Label";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";

const pipelineNameAnnotationKey: string = "pipeline-name";
const pipelineIdAnnotationKey: string = "pipeline-id";

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

    public static getPipelineText(annotations: { [key: string]: string }): string {
        let pipelineName: string = "", pipelineId: string = "";
        
        annotations && Object.keys(annotations).find(key => {
            const keyVal: string = key.toLowerCase();
            if (!pipelineName && keyVal === pipelineNameAnnotationKey) {
                pipelineName = annotations[key];
            }
            else if (!pipelineId && keyVal === pipelineIdAnnotationKey) {
                pipelineId = annotations[key];
            }

            return !!pipelineName && !!pipelineId;
        });

        return pipelineName && pipelineId ? format("{0} / {1}", pipelineName, pipelineId) : "";
    }

    public static _getPodsStatusProps(currentScheduledPods: number, desiredPods: number): IStatusProps | undefined {
        //todo modify logic to base on pod events so that we can distinguish between pending/failed pods
        if (desiredPods != null && currentScheduledPods != null && desiredPods > 0) {
            return currentScheduledPods < desiredPods ? Statuses.Failed : Statuses.Success;
        }

        return undefined;
    }
}