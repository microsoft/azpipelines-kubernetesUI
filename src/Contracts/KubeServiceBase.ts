/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as K8sTypes from "@kubernetes/client-node";
import { IKubeService } from "./Contracts";

export enum KubeResourceType {
    Pods = 1,
    Deployments = 2,
    Services = 4,
    ReplicaSets = 8,
    DaemonSets = 16,
    StatefulSets = 32,
}

export abstract class KubeServiceBase implements IKubeService {
    getPods(labelSelector?: string): Promise<K8sTypes.V1PodList> {
        return this.fetch(KubeResourceType.Pods, labelSelector);
    }

    getDeployments(): Promise<K8sTypes.V1DeploymentList> {
        return this.fetch(KubeResourceType.Deployments);
    }

    getServices(): Promise<K8sTypes.V1ServiceList> {
        return this.fetch(KubeResourceType.Services);
    }

    getReplicaSets(): Promise<K8sTypes.V1ReplicaSetList> {
        return this.fetch(KubeResourceType.ReplicaSets);
    }

    getDaemonSets(): Promise<K8sTypes.V1DaemonSetList> {
        return this.fetch(KubeResourceType.DaemonSets);
    }

    getStatefulSets(): Promise<K8sTypes.V1StatefulSetList> {
        return this.fetch(KubeResourceType.StatefulSets);
    }

    abstract getPodLog(podName: string, podContainerName?: string): Promise<string>;

    abstract fetch(resourceType: KubeResourceType, labelSelector?: string): Promise<any>;
}