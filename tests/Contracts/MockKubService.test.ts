import { KubeServiceBase, KubeResourceType } from "../../src/Contracts/KubeServiceBase";

class MockKubeService extends KubeServiceBase {
    public fetch(resourceType: KubeResourceType): Promise<any> {
        return Promise.resolve(resourceType);
    }
}

describe("KubeServiceBase Tests", () => {
    let service: MockKubeService;
    beforeAll(() => {
        service = new MockKubeService();
    });

    afterAll(() => { service = null; });

    it("getPods calls with right input", () => {
        expect.assertions(1);
        return service.getPods().then(output => {
            expect(output).toBe(KubeResourceType.Pods);
        });
    });

    it("getDeployments calls with right input", () => {
        expect.assertions(1);
        return service.getDeployments().then(output => {
            expect(output).toBe(KubeResourceType.Deployments);
        });
    });

    it("getReplicaSets calls with right input", () => {
        expect.assertions(1);
        return service.getReplicaSets().then(output => {
            expect(output).toBe(KubeResourceType.ReplicaSets);
        });
    });

    it("getServices calls with right input", () => {
        expect.assertions(1);
        return service.getServices().then(output => {
            expect(output).toBe(KubeResourceType.Services);
        });
    });
});
