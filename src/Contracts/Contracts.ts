/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as K8sTypes from "@kubernetes/client-node";
import { IImageDetails } from "./Types";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";

export interface IKubeService {
    getPods(labelSelector?: string): Promise<K8sTypes.V1PodList>;

    getDeployments(): Promise<K8sTypes.V1DeploymentList>;

    getServices(): Promise<K8sTypes.V1ServiceList>;

    getReplicaSets(): Promise<K8sTypes.V1ReplicaSetList>;

    getDaemonSets(): Promise<K8sTypes.V1DaemonSetList>;

    getStatefulSets(): Promise<K8sTypes.V1StatefulSetList>;
}

export enum KubeImage {
    zeroData = "zeroData",
    zeroResults = "zeroResults",
    zeroWorkloads = "zeroWorkloads"
}

export interface IImageService {
    hasImageDetails(listImages: Array<string>): Promise<any>;

    getImageDetails(imageName: string): Promise<IImageDetails | undefined>;
}

export interface ITelemetryService {
    onClickTelemetry(source: string, additionalProperties?: { [key: string]: any }): void;
    scenarioStart(scenarioName: string, additionalProperties?: { [key: string]: any }): void;
    scenarioEnd(scenarioName: string, additionalProperties?: { [key: string]: any }): void;
}

/**
 * https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase
 **/
export enum PodPhase {
    Pending = "Pending",
    Running = "Running",
    Succeeded = "Succeeded",
    Failed = "Failed",
    Unknown = "Unknown",
    Completed = "Completed",
    CrashLoopBackOff = "CrashLoopBackOff",
}