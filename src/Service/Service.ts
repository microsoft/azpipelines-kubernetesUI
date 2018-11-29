
import { CommonServiceIds, getClient, IProjectInfo, IProjectPageService } from "azure-devops-extension-api";
import { DataSourceDetails, ServiceEndpointRequest, ServiceEndpointRestClient } from "azure-devops-extension-api/ServiceEndpoint";
import * as SDK from "azure-devops-extension-sdk";
import { KubeResourceType, KubeServiceBase } from "../Contracts/Contracts";

export class AzureDevOpsKubeService extends KubeServiceBase {
    constructor(private _serviceEndpointId: string, private _namespace: string) {
        super();
        SDK.init();
    }

    async fetch(resourceType: KubeResourceType): Promise<any> {
        const projectService: IProjectPageService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project: IProjectInfo = await projectService.getProject() as IProjectInfo;

        const params: { [key: string]: string } = {};
        params["KubernetesNamespace"] = this._namespace;

        let dataSourceName: string = "";
        switch (resourceType) {
            case KubeResourceType.Pods:
                dataSourceName = "KubernetesPodsInNamespace";
                break;
            case KubeResourceType.Deployments:
                dataSourceName = "KubernetesDeploymentsInNamespace";
                break;
            case KubeResourceType.Services:
                dataSourceName = "KubernetesServicesInNamespace";
                break;
            case KubeResourceType.ReplicaSets:
                dataSourceName = "KubernetesReplicasetsInNamespace";
                break;
        }

        const resourceRequest: ServiceEndpointRequest = {
            dataSourceDetails: {
                dataSourceName: dataSourceName,
                parameters: params,
            } as DataSourceDetails
        } as ServiceEndpointRequest;

        const requestResult = await getClient(ServiceEndpointRestClient)
            .executeServiceEndpointRequest(resourceRequest, project.id, this._serviceEndpointId);
        return JSON.parse(requestResult.result);
    }
}