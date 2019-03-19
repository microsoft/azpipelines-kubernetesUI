/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1Pod, V1PodSpec, V1PodStatus } from "@kubernetes/client-node";
import { equals, format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { PodPhase } from "../Contracts/Contracts";
import * as Resources from "./Resources";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { ILabelModel } from "azure-devops-ui/Label";

const pipelineNameAnnotationKey: string = "azure-pipelines/pipeline";
const pipelineExecutionIdAnnotationKey: string = "azure-pipelines/execution";

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

    public static getPillTags(items: { [key: string]: string }): string[] {
        let tags: string[] = [];
        if (items) {
            Object.keys(items).forEach((key: string) => {
                tags.push(format("{0}={1}", key, items[key]));
            });
        }

        return tags;
    }

    public static getPipelineText(annotations: { [key: string]: string }): string {
        let pipelineName: string = "";
        let pipelineExecutionId: string = "";
        const keys = annotations ? Object.keys(annotations) : [];

        keys.find(key => {
            const keyVal: string = key.toLowerCase();
            if (!pipelineName && keyVal === pipelineNameAnnotationKey) {
                pipelineName = annotations[key];
            }
            else if (!pipelineExecutionId && keyVal === pipelineExecutionIdAnnotationKey) {
                pipelineExecutionId = annotations[key];
            }

            return !!pipelineName && !!pipelineExecutionId;
        });

        return pipelineName && pipelineExecutionId ? localeFormat("{0} / {1}", pipelineName, pipelineExecutionId) : "";
    }

    public static getPodsStatusProps(currentScheduledPods: number, desiredPods: number): IStatusProps | undefined {
        // todo:: modify logic to base on pod events so that we can distinguish between pending/failed pods
        if (desiredPods != null && desiredPods > 0) {
            return currentScheduledPods == null || currentScheduledPods < desiredPods ? Statuses.Failed : Statuses.Success;
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

    public static getImageText(podSpec: V1PodSpec | undefined): { imageText: string, imageTooltipText?: string} {
        let images: string[] = [];
        let imageText: string = "";
        let imageTooltipText: string = "";
        if (podSpec && podSpec.containers && podSpec.containers.length > 0) {
            podSpec.containers.forEach(container => {
                if (images.indexOf(container.image) < 0) {
                    images.push(container.image);
                }
            });

            if (images.length > 1) {
                imageText = localeFormat(Resources.MoreImagesText, images[0], images.length - 1);
                imageTooltipText = images.join(", ");
            } else {
                imageText = images[0];
            }
        }

        return { imageText: imageText, imageTooltipText: imageTooltipText };
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