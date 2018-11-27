
import * as SDK from "azure-devops-extension-sdk";
import { getClient, IProjectPageService, CommonServiceIds, IProjectInfo } from "azure-devops-extension-api";
import { ServiceEndpointRestClient, DataSourceDetails, ServiceEndpointRequest } from "azure-devops-extension-api/ServiceEndpoint";

import { KubeServiceBase, KubeResourceType } from "../Contracts/Contracts";

export class AzureDevOpsKubeService extends KubeServiceBase {
    constructor(private _serviceEndpointId: string, private _namespace: string) {
        super();
        SDK.init();
    }

    async fetch(resourceType: KubeResourceType): Promise<any> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project: IProjectInfo = await projectService.getProject() as IProjectInfo;

        const params: { [key: string]: string } = {};
        params["KubernetesNamespace"] = this._namespace;

        let dataSourceName = "";
        switch(resourceType) {
            case KubeResourceType.Pods:
                dataSourceName = "KubernetesPodsInNamespace";
                break;
            case KubeResourceType.Deployments:
                dataSourceName = "KubernetesDeploymentsInNamespace";
                break;
            case KubeResourceType.Services:
                dataSourceName = "KubernetesServicesInNamespace";
                break;
            case KubeResourceType.Replicasets:
                dataSourceName = "KubernetesReplicasetsInNamespace";
                break;
        }

        let resourceRequest = {
            dataSourceDetails: {
                dataSourceName: dataSourceName,
                parameters: params,
            } as DataSourceDetails
        } as ServiceEndpointRequest;
        
        let requestResult = await getClient(ServiceEndpointRestClient).executeServiceEndpointRequest(resourceRequest, project.id, this._serviceEndpointId);
        return JSON.parse(requestResult.result);
    }
}