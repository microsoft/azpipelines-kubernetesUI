import * as K8sTypes from "@kubernetes/client-node";
import { IService } from "./Types";

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