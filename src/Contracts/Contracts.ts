
import * as K8sTypes from "@kubernetes/client-node";

export interface IKubeService {
    getPods(): Promise<K8sTypes.V1PodList>;

    getDeployments(): Promise<K8sTypes.V1DeploymentList>;

    getServices(): Promise<K8sTypes.V1ServiceList>;

    getReplicasets(): Promise<K8sTypes.V1ReplicaSetList>;
}

export enum KubeResourceType {
    Pods = 1,
    Deployments = 2,
    Services = 4,
    Replicasets = 8,
}

export abstract class KubeServiceBase implements IKubeService {
    getPods(): Promise<K8sTypes.V1PodList> {
        return this.fetch(KubeResourceType.Pods);
    }

    getDeployments(): Promise<K8sTypes.V1DeploymentList> {
        return this.fetch(KubeResourceType.Deployments);
    }
    getServices(): Promise<K8sTypes.V1ServiceList> {
        return this.fetch(KubeResourceType.Services);
    }
    getReplicasets(): Promise<K8sTypes.V1ReplicaSetList> {
        return this.fetch(KubeResourceType.Replicasets);
    }

    abstract fetch(resourceType: KubeResourceType): Promise<any>;
}