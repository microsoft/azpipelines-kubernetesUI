/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as K8sTypes from "@kubernetes/client-node";
import { IImageDetails } from "./Types";

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
    hasImageDetails(listImages: Array<string>): Promise<{ [key: string]: boolean } | undefined>;

    getImageDetails(imageName: string): Promise<IImageDetails | undefined>;
}