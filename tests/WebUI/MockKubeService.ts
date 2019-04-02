import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { KubeResourceType, KubeServiceBase } from "../../src/Contracts/KubeServiceBase";

export class MockKubeService extends KubeServiceBase {
    public fetch(resourceType: KubeResourceType, labelSelector?: string): Promise<any> {
        return Promise.resolve(labelSelector ? localeFormat("{0}{1}", resourceType, labelSelector || "") : resourceType);
    }

    public getPodLog(podName: string): Promise<string> {
        return Promise.resolve(localeFormat("Output:{0}", podName));
    }
}