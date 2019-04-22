import { V1Service, V1ServicePort } from "@kubernetes/client-node";
import { IServiceItem } from "../Types";
import { Utils } from "../Utils";
import { localeFormat } from "azure-devops-ui/Core/Util/String";

export function getServiceItems(serviceList: V1Service[]): IServiceItem[] {
    let items: IServiceItem[] = [];
    serviceList.forEach(service => {
        items.push({
            package: service.metadata.name,
            type: service.spec.type,
            clusterIP: service.spec.clusterIP || "-",
            externalIP: _getExternalIP(service),
            port: _getPort(service) || "",
            creationTimestamp: service.metadata.creationTimestamp || new Date(),
            uid: service.metadata.uid.toLowerCase(),
            pipeline: Utils.getPipelineText(service.metadata.annotations),
            service: service,
            kind: service.kind || "Service"
        });
    });

    return items;
}

function _getPort(service: V1Service): string {
    if (service.spec
        && service.spec.ports
        && service.spec.ports.length > 0) {
        const ports = service.spec.ports.map(port => _formatPortString(port));
        return ports.join(", ");
    }

    return "";
}

function _formatPortString(servicePort: V1ServicePort): string {
    const nodePort = servicePort.nodePort ? ":" + servicePort.nodePort : "";
    // example: 80:2080/TCP, if nodeport. 80/TCP, if no nodeport
    return localeFormat("{0}{1}/{2}", servicePort.port, nodePort, servicePort.protocol);
}


function _getExternalIP(service: V1Service): string {
    return service.status
        && service.status.loadBalancer
        && service.status.loadBalancer.ingress
        && service.status.loadBalancer.ingress.length > 0
        && service.status.loadBalancer.ingress[0].ip
        || "";
}
