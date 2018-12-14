/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta } from "@kubernetes/client-node";
import { format } from "@uifabric/utilities/lib";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ILabelModel } from "azure-devops-ui/Label";

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
        Object.keys(annotations).find(key => {
            if (!pipelineName && key.toLowerCase() === pipelineNameAnnotationKey) {
                pipelineName = annotations[key];
            }
            else if (!pipelineId && key.toLowerCase() === pipelineIdAnnotationKey) {
                pipelineId = annotations[key];
            }

            return !!pipelineName && !!pipelineId;
        });

        return pipelineName && pipelineId ? format("{0} / {1}", pipelineName, pipelineId) : "";
    }
}