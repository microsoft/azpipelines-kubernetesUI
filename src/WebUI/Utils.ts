/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1PodStatus, V1PodTemplateSpec, V1Container, V1PodSpec, V1Pod } from "@kubernetes/client-node";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { format, localeFormat, equals } from "azure-devops-ui/Core/Util/String";
import { ILabelModel } from "azure-devops-ui/Label";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import * as Resources from "./Resources";

const pipelineNameAnnotationKey: string = "pipeline-name";
const pipelineIdAnnotationKey: string = "pipeline-id";

/**
 * https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase
 */
enum PodPhase {
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

        return pipelineName && pipelineId ? localeFormat("{0} / {1}", pipelineName, pipelineId) : "";
    }

    public static _getPodsStatusProps(currentScheduledPods: number, desiredPods: number): IStatusProps | undefined {
        //todo modify logic to base on pod events so that we can distinguish between pending/failed pods
        if (desiredPods != null && currentScheduledPods != null && desiredPods > 0) {
            return currentScheduledPods < desiredPods ? Statuses.Failed : Statuses.Success;
        }

        return undefined;
    }
    public static generateEqualsConditionLabelSelector(labels: { [key: string]: string }): string {
        let labelSelector: string = "";
        if (labels) {
            const keySet = Object.keys(labels);
            keySet.forEach((key, index) => {
                labelSelector = labelSelector.concat(format("{0}={1}", key, labels[key]))
                if (index < keySet.length - 1) labelSelector = labelSelector.concat(",");
            });
        }
        return labelSelector;
    }

    public static generatePodStatusProps(status: V1PodStatus): IStatusProps {
        if (status.phase === PodPhase.Running || status.phase === PodPhase.Succeeded) {
            return Statuses.Success;
        }
        return Statuses.Failed;
    }

    public static filterByName(objectName: string, filterKey?: string): boolean {
        if (filterKey) {
            return objectName.includes(filterKey);
        }
        return true;
    }

    public static getImageText(podSpec: V1PodSpec | undefined): string {
        let images: string[] = [];
        let imageString: string = "";
        if (podSpec && podSpec.containers && podSpec.containers.length > 0) {
            podSpec.containers.forEach(container => {
                if (images.indexOf(container.image) < 0) {
                    images.push(container.image)
                }
            });

            if (images.length > 1) {
                imageString = localeFormat(Resources.MoreImagesText, images[0], images.length - 1);
            } else {
                imageString = images[0];
            }
        }

        return imageString;
    }

    public static getFirstImageName(podSpec: V1PodSpec | undefined): string {
        if (podSpec && podSpec.containers && podSpec.containers.length > 0) {
            return podSpec.containers[0].image;
        }

        return "";
    }

    public static getImageId(imageName: string, podMetadata: V1ObjectMeta, pods: V1Pod[]): string {
        let imageId: string = "";
        if (pods.length > 0) {
            const matchingPod: V1Pod | undefined = pods.find(pod => { return pod.metadata && podMetadata && equals(pod.metadata.uid, podMetadata.uid, true) });
            if (matchingPod) {
                const podStatus = matchingPod.status;
                if (podStatus.containerStatuses && podStatus.containerStatuses.length > 0) {
                    const containerStatusForGivenImage = podStatus.containerStatuses.find(status => equals(status.image, imageName, true));
                    if (containerStatusForGivenImage) {
                        imageId = containerStatusForGivenImage.imageID;
                    }
                }
            }
        }

        return imageId;
    }
}