import * as React from "react";
import { KubeServiceBase, KubeResourceType } from "../../../src/Contracts/KubeServiceBase";
import { KubeSummary } from "../../../src/WebUI/Components/KubeSummary";
import { shallow } from "../../TestCore";
import { IServiceItem } from "../../../src/WebUI/Types";
import { ServiceComponent } from "../../../src/WebUI/Components/ServiceComponent";

class ZeroDataService extends KubeServiceBase {
    public fetch(resourceType: KubeResourceType, labelSelector?: string): Promise<any> {
        switch (resourceType) {
            case KubeResourceType.DaemonSets:
                return Promise.resolve({ "kind": "DaemonSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/daemonsets", "resourceVersion": "7637168" }, "items": [] });
            case KubeResourceType.Deployments:
                return Promise.resolve({ "kind": "DeploymentList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/deployments", "resourceVersion": "7637168" }, "items": [] });
            case KubeResourceType.Pods:
                return Promise.resolve({ "kind": "PodList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces/default/pods", "resourceVersion": "7637168" }, "items": [] });
            case KubeResourceType.ReplicaSets:
                return Promise.resolve({ "kind": "ReplicaSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/replicasets", "resourceVersion": "7637168" }, "items": [] });
            case KubeResourceType.Services:
                return Promise.resolve({ "kind": "ServiceList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces/default/services", "resourceVersion": "7637168" }, "items": [] });
            case KubeResourceType.StatefulSets:
                return Promise.resolve({ "kind": "StatefulSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/statefulsets", "resourceVersion": "7637168" }, "items": [] });
        }
    }
}

describe("Testing various scenarios where zero data component should be displayed", () => {

    let service: KubeServiceBase;
    const zeroDataComp: string = "ZeroDataComponent";

    it("when there are no workloads, zero data should be shown", () => {
        service = new ZeroDataService();
        const wrapper = shallow(<KubeSummary kubeService={service} title={"Mock"} />);
        //since mock services do not return any data, zero data component should be rendered
        const zeroData = wrapper.find(zeroDataComp);
        expect(!!zeroData && zeroData.length > 0).toBeTruthy();
    });

    it("when there are no associated pods for a service, zero data should be shown", () => {
        const mockSvcItem: IServiceItem = {
            clusterIP: "",
            creationTimestamp: new Date(),
            externalIP: "",
            kind: "Mock Service",
            type: "Mock Package",
            port: "",
            pipeline: "",
            package: "Mock package",
            uid: "foo-bar"
        };

        const wrapper = shallow(<ServiceComponent service={mockSvcItem} />);
        const zeroData = wrapper.find(zeroDataComp);
        expect(!!zeroData && zeroData.length > 0).toBeTruthy();
    });

    //This test is not working as expected.
    //class NonZeroDataService extends KubeServiceBase {
    //     public fetch(resourceType: KubeResourceType, labelSelector ?: string): Promise < any > {
    //         switch(resourceType) {
    //             case KubeResourceType.DaemonSets:
    //         return Promise.resolve({ "kind": "DaemonSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/daemonsets", "resourceVersion": "7637168" }, "items": [] });
    //         case KubeResourceType.Deployments:
    //         return Promise.resolve({ "kind": "DeploymentList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/deployments", "resourceVersion": "7637168" }, "items": [] });
    //         case KubeResourceType.Pods:
    //         return Promise.resolve({ "kind": "PodList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces/default/pods", "resourceVersion": "7856197" }, "items": [{ "metadata": { "name": "orphan-pod", "namespace": "default", "selfLink": "/api/v1/namespaces/default/pods/orphan-pod", "uid": "4618ea84-037c-11e9-8bfb-d2d4f377e80b", "resourceVersion": "6918601", "creationTimestamp": "2018-12-19T10:53:09Z", "annotations": { "kubectl.kubernetes.io/last-applied-configuration": "{\"apiVersion\":\"v1\",\"kind\":\"Pod\",\"metadata\":{\"annotations\":{},\"name\":\"orphan-pod\",\"namespace\":\"default\"},\"spec\":{\"containers\":[{\"image\":\"k8s.gcr.io/nginx-slim:0.8\",\"name\":\"dummy\",\"ports\":[{\"containerPort\":80}]}],\"restartPolicy\":\"Never\"}}\n" } }, "spec": { "volumes": [{ "name": "default-token-jjd9x", "secret": { "secretName": "default-token-jjd9x", "defaultMode": 420 } }], "containers": [{ "name": "dummy", "image": "k8s.gcr.io/nginx-slim:0.8", "ports": [{ "containerPort": 80, "protocol": "TCP" }], "env": [{ "name": "KUBERNETES_PORT_443_TCP_ADDR", "value": "rkolaks-rkol-test-c00d16-6cf9ccd5.hcp.southindia.azmk8s.io" }, { "name": "KUBERNETES_PORT", "value": "tcp://rkolaks-rkol-test-c00d16-6cf9ccd5.hcp.southindia.azmk8s.io:443" }, { "name": "KUBERNETES_PORT_443_TCP", "value": "tcp://rkolaks-rkol-test-c00d16-6cf9ccd5.hcp.southindia.azmk8s.io:443" }, { "name": "KUBERNETES_SERVICE_HOST", "value": "rkolaks-rkol-test-c00d16-6cf9ccd5.hcp.southindia.azmk8s.io" }], "resources": {}, "volumeMounts": [{ "name": "default-token-jjd9x", "readOnly": true, "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount" }], "terminationMessagePath": "/dev/termination-log", "terminationMessagePolicy": "File", "imagePullPolicy": "IfNotPresent" }], "restartPolicy": "Never", "terminationGracePeriodSeconds": 30, "dnsPolicy": "ClusterFirst", "serviceAccountName": "default", "serviceAccount": "default", "nodeName": "aks-nodepool1-38755115-2", "securityContext": {}, "schedulerName": "default-scheduler", "tolerations": [{ "key": "node.kubernetes.io/not-ready", "operator": "Exists", "effect": "NoExecute", "tolerationSeconds": 300 }, { "key": "node.kubernetes.io/unreachable", "operator": "Exists", "effect": "NoExecute", "tolerationSeconds": 300 }] }, "status": { "phase": "Running", "conditions": [{ "type": "Initialized", "status": "True", "lastProbeTime": null, "lastTransitionTime": "2018-12-19T10:53:09Z" }, { "type": "Ready", "status": "True", "lastProbeTime": null, "lastTransitionTime": "2018-12-19T10:53:13Z" }, { "type": "PodScheduled", "status": "True", "lastProbeTime": null, "lastTransitionTime": "2018-12-19T10:53:09Z" }], "hostIP": "10.240.0.4", "podIP": "10.244.0.21", "startTime": "2018-12-19T10:53:09Z", "containerStatuses": [{ "name": "dummy", "state": { "running": { "startedAt": "2018-12-19T10:53:13Z" } }, "lastState": {}, "ready": true, "restartCount": 0, "image": "k8s.gcr.io/nginx-slim:0.8", "imageID": "docker-pullable://k8s.gcr.io/nginx-slim@sha256:8b4501fe0fe221df663c22e16539f399e89594552f400408303c42f3dd8d0e52", "containerID": "docker://14c0089fb0e0fd332c7faa4a09eae93f571c488ad3740312efc18f4acddfbb26" }], "qosClass": "BestEffort" } }] });
    //         case KubeResourceType.ReplicaSets:
    //         return Promise.resolve({ "kind": "ReplicaSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/replicasets", "resourceVersion": "7637168" }, "items": [] });
    //         case KubeResourceType.Services:
    //         return Promise.resolve({ "kind": "ServiceList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces/default/services", "resourceVersion": "7637168" }, "items": [] });
    //         case KubeResourceType.StatefulSets:
    //         return Promise.resolve({ "kind": "StatefulSetList", "apiVersion": "apps/v1", "metadata": { "selfLink": "/apis/apps/v1/namespaces/default/statefulsets", "resourceVersion": "7637168" }, "items": [] });
    //     }
    //     }
    // }
    // it("when there is a workload and no services, pivot with service page showing zero data", () => {
    //     let wrapper = mount(<KubeSummary kubeService={new NonZeroDataService()} title={"Mock"} />);
    //     console.log(wrapper.debug());
    //     console.log();
    //     for (let i = 0; i < 7; i++) {
    //         console.log("updating " + i);
    //        wrapper =  wrapper.update();
    //     }
    //     console.log(wrapper.debug());
    //     console.log();
    //     expect(true).toBeTruthy();
    // })
    
})