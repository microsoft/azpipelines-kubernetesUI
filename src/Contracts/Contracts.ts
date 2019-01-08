/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as K8sTypes from "@kubernetes/client-node";

export interface IKubeService {
    getPods(labelSelector?:string): Promise<K8sTypes.V1PodList>;

    getDeployments(): Promise<K8sTypes.V1DeploymentList>;

    getServices(): Promise<K8sTypes.V1ServiceList>;

    getReplicaSets(): Promise<K8sTypes.V1ReplicaSetList>;

    getDaemonSets(): Promise<K8sTypes.V1DaemonSetList>;

    getStatefulSets(): Promise<K8sTypes.V1StatefulSetList>;

    getPodLogs(podName:string): Promise<any>;

    getK8sConfig(): Promise<string>;
}