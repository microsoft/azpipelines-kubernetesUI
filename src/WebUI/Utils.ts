/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as React from "react";
import { V1ObjectMeta, V1Pod, V1PodSpec, V1PodStatus } from "@kubernetes/client-node";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { ILabelModel } from "azure-devops-ui/Label";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { PodPhase } from "../Contracts/Contracts";
import * as Resources from "./Resources";

const pipelineNameAnnotationKey: string = "azure-pipelines/pipeline";
const pipelineRunIdAnnotationKey: string = "azure-pipelines/execution";
const pipelineRunUrlAnnotationKey: string = "azure-pipelines/executionuri";
const pipelineJobNameAnnotationKey: string = "azure-pipelines/jobName";
const matchPatternForImageName = new RegExp(/\:\/\/(.+?)\@/);
const matchPatternForDigest = new RegExp(/\@sha256\:(.+)/);
const invalidCharPatternInNamespace = new RegExp(/[:.]/);

export interface IMetadataAnnotationPipeline {
    runName: string | undefined;
    runUrl: string | undefined;
    pipelineName: string | undefined;
    jobName: string | undefined;
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
            else if (!pipelineExecutionId && keyVal === pipelineRunIdAnnotationKey) {
                pipelineExecutionId = annotations[key];
            }

            return !!pipelineName && !!pipelineExecutionId;
        });

        return pipelineName && pipelineExecutionId ? localeFormat("{0} / {1}", pipelineName, pipelineExecutionId) : "";
    }

    public static getPipelineDetails(annotations: { [key: string]: string }): IMetadataAnnotationPipeline {
        if (!annotations) {
            return {} as IMetadataAnnotationPipeline;
        }

        return {
            jobName: annotations[pipelineJobNameAnnotationKey],
            pipelineName: annotations[pipelineNameAnnotationKey],
            runName: annotations[pipelineRunIdAnnotationKey],
            runUrl: annotations[pipelineRunUrlAnnotationKey]
        };
    }

    public static getPodsStatusProps(currentPods: number, desiredPods: number): { statusProps: IStatusProps | undefined, pods: string, podsTooltip: string } {
        let statusProps: IStatusProps | undefined = undefined;
        let podsText = "", podsTooltip = "";
        if (desiredPods != null && desiredPods > 0) {
            const availableCount = currentPods == null || currentPods <= 0 ? 0 : currentPods;
            const diffCount = desiredPods - availableCount;
            statusProps = availableCount < desiredPods ? Statuses.Failed : Statuses.Success;
            podsText = localeFormat("{0}/{1}", availableCount, desiredPods);
            podsTooltip = availableCount === desiredPods
                ? Resources.AllPodsRunningText
                : diffCount === 1 ? Resources.PodNotReadyText : localeFormat(Resources.PodsNotReadyText, diffCount);
        }

        return { statusProps: statusProps, pods: podsText, podsTooltip: podsTooltip };
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

    public static generatePodStatusProps(status: V1PodStatus): { statusProps: IStatusProps, tooltip: string } {
        let statusProps: IStatusProps = Statuses.Failed;
        let tooltip: string = status.message || status.phase;
        if (status.phase === PodPhase.Running || status.phase === PodPhase.Succeeded) {
            statusProps = Statuses.Success;
        }

        const failedContainerState = (status.containerStatuses || []).find(cs => !cs.ready && !cs.state.running);
        if (failedContainerState) {
            const failedState = failedContainerState.state;
            statusProps = Statuses.Failed;
            tooltip = failedState.waiting && failedState.waiting.message
                || failedState.terminated && failedState.terminated.message;
        }

        return { statusProps: statusProps, tooltip: tooltip };
    }

    public static filterByName(objectName: string, filterKey?: string): boolean {
        if (filterKey) {
            return objectName.includes(filterKey);
        }
        return true;
    }

    public static getImageText(podSpec: V1PodSpec | undefined): { imageText: string, imageTooltipText?: string } {
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

    public static getFirstContainerName(podSpec: V1PodSpec | undefined): string {
        if (podSpec && podSpec.containers && podSpec.containers.length > 0) {
            return podSpec.containers[0].name;
        }

        return "";
    }

    public static getImageIdsForPods(pods: V1Pod[]): string[] {
        let imageIds: string[] = [];
        for (const pod of pods) {
            const podStatus = pod.status;
            if (podStatus.containerStatuses && podStatus.containerStatuses.length > 0) {
                for (const containerStatus of podStatus.containerStatuses) {
                    // Construct the query URL as per Grafeas format
                    let imgId = Utils.getImageResourceUrl(containerStatus.imageID);
                    if (imgId && (imageIds.length == 0 || imageIds.indexOf(imgId) < 0))
                        imageIds.push(imgId);
                }
            }
        }

        return imageIds;
    }

    public static getImageIdForWorkload(containerName: string, pods: V1Pod[], ownerId?: string): string {
        // The image name in parent.spec.template.spec.containers and in pod.status.containerStatuses is not a constant, example it is redis in former, and redis:latest in latter
        // Hence filtering the pods on the basis of container name which is a constant
        const getImageIdForMatchingPods = (pods: V1Pod[]): string => {
            for (const pod of pods) {
                const podStatus = pod.status;
                if (podStatus.containerStatuses && podStatus.containerStatuses.length > 0) {
                    // Return the imageId for the first matching pod
                    const containerStatusForGivenImage = podStatus.containerStatuses.find(status => status.name.toLowerCase() === containerName.toLowerCase());
                    if (containerStatusForGivenImage && containerStatusForGivenImage.imageID) {
                        // Construct the query URL as per Grafeas format
                        return Utils.getImageResourceUrl(containerStatusForGivenImage.imageID);
                    }
                }
            }

            return "";
        }

        if (ownerId && pods.length > 0) {
            const matchingPods: V1Pod[] = pods.filter(pod => { return pod.metadata && Utils.isOwnerMatched(pod.metadata, ownerId.toLowerCase()) });
            return getImageIdForMatchingPods(matchingPods);
        }
        else {
            return getImageIdForMatchingPods(pods);
        }
    }

    public static getImageResourceUrlParameter(imageId: string, matchPattern: RegExp): string {
        const imageMatch = imageId.match(matchPattern);
        if (imageMatch && imageMatch.length >= 1) {
            return imageMatch[1];
        }

        return "";
    }

    public static getImageResourceUrl(imageId: string): string {
        const sha256Text = "@sha256:";
        const separator = "://";
        let indexOfSeparator = imageId.indexOf(separator);
        let image = indexOfSeparator >= 0 ? imageId.substr(indexOfSeparator + separator.length) : imageId;
        const digest = Utils.getImageResourceUrlParameter(imageId, matchPatternForDigest);

        // This match pattern is copied over from DockerV2 task to maintain parity between image Urls
        let match = image.match(/^(?:([^\/]+)\/)?(?:([^\/]+)\/)?([^@:\/]+)(?:[@:](.+))?$/);
        if (!match) {
            return "";
        }

        let registry = match[1];
        let imgNamespace = match[2];
        let repository = match[3];

        if (!imgNamespace && registry && !/[:.]/.test(registry)) {
            imgNamespace = registry;
            registry = "docker.io";
        }

        if (!imgNamespace && !registry) {
            registry = "docker.io";
            imgNamespace = "library";
        }

        registry = registry ? registry + "/" : "";
        imgNamespace = imgNamespace ? imgNamespace + "/" : "";

        return format("https://{0}{1}{2}{3}{4}", registry, imgNamespace, repository, sha256Text, digest);
    }

    public static extractDisplayImageName(imageId: string): string {
        return Utils.getImageResourceUrlParameter(imageId, matchPatternForImageName);
    }
}