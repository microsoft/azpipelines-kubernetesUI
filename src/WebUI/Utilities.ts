import * as K8sTypes from "@kubernetes/client-node";

import { IPod, IService, IReplicaset, IDeployment } from "./Types";

export function convertPodsForComponent(pods: K8sTypes.V1PodList): IPod[] {
    return (pods && pods.items || []).map((pod) => {
        return {
            name: pod.metadata && pod.metadata.name || "",
            namespace: pod.metadata && pod.metadata.namespace || "",
            status: pod.status && pod.status.phase || "",
            image: pod.spec && pod.spec.containers && pod.spec.containers.length > 0 && pod.spec.containers[0].image || "",
            nodeName: pod.spec && pod.spec.nodeName || ""
        } as IPod;
    });
}

export function convertServicesForComponent(services: K8sTypes.V1ServiceList): IService[] {
    return (services && services.items || []).map((service) => {
        return {
            name: service.metadata && service.metadata.name || "",
            namespace: service.metadata && service.metadata.namespace || "",
            type: service.spec && service.spec.type || "",
            clusterIP: service.spec && service.spec.clusterIP || "",
            externalIP: service.status && service.status.loadBalancer && service.status.loadBalancer.ingress && service.status.loadBalancer.ingress.length > 0 && service.status.loadBalancer.ingress[0].ip || "",
        } as IService;
    });
}

export function convertDeploymentsForComponent(deployments: K8sTypes.V1DeploymentList): IDeployment[] {
    return (deployments && deployments.items || []).map((deployment) => {
        return {
            name: deployment.metadata && deployment.metadata.name || "",
            namespace: deployment.metadata && deployment.metadata.namespace || "",
            replicas: deployment.spec && deployment.spec.replicas || "",
            readyReplicas: deployment.status && deployment.status.readyReplicas || "",
            strategy: deployment.spec && deployment.spec.strategy && deployment.spec.strategy.type || "",
        } as IDeployment;
    });
}

export function convertReplicasetsForComponent(replicasets: K8sTypes.V1ReplicaSetList): IReplicaset[] {
    return (replicasets && replicasets.items || []).map((replicaset) => {
        return {
            name: replicaset.metadata && replicaset.metadata.name || "",
            namespace: replicaset.metadata && replicaset.metadata.namespace || "",
            replicas: replicaset.spec && replicaset.spec.replicas || "",
            readyReplicas: replicaset.status && replicaset.status.readyReplicas || "",
            appName: replicaset.metadata && replicaset.metadata.ownerReferences && replicaset.metadata.ownerReferences.length > 0 && replicaset.metadata.ownerReferences[0].name || ""
        } as IReplicaset;
    });
}