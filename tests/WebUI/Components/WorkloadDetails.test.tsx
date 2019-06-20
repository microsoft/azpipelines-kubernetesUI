import { V1Service, V1ReplicaSet, V1ReplicaSetSpec, V1ReplicaSetStatus, V1ObjectMeta } from "@kubernetes/client-node";
import * as String_Utils from "azure-devops-ui/Core/Util/String";
import { Statuses } from "azure-devops-ui/Status";
import * as React from "react";
import { WorkloadDetails } from "../../../src/WebUI/Workloads/WorkloadDetails";
import { IServiceItem } from "../../../src/WebUI/Types";
import { mount, shallow } from "../../TestCore";
import { SelectedItemKeys } from "../../../src/WebUI/Constants";

describe("WorkloadDetails component tests", () => {

    const name = "some package name" + String_Utils.newGuid();
    const uid = "3014b92b-724e-49a8-8fd3-135d025de247";
    const createdDate = new Date(2015, 10, 10);

    const item = {
        "metadata": {
            "name": "azure-vote-front-f747b5d4b",
            "namespace": "default",
            "uid": "b5187188-495e-11e9-96d5-96c741883af0",
            "creationTimestamp": "2019-03-18T09:17:52Z",
            "labels": { "app": "azure-vote-front", "pod-template-hash": "f747b5d4b" },
            "annotations": { "azure-pipelines/execution": "executionname" },
            "ownerReferences": [{
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "name": "azure-vote-front",
                "uid": "b512b229-495e-11e9-96d5-96c741883af0",
            }]
        } as any,
        "spec": {
            "replicas": 6,
            "minReadySeconds": 5,
            "selector": { "matchLabels": { "app": "azure-vote-front", "pod-template-hash": "f747b5d4b" } },
            "template": {
                "metadata": {
                    "labels": { "app": "azure-vote-front", "pod-template-hash": "f747b5d4b" }
                },
                "spec": {
                    "containers": [{
                        "name": "azure-vote-front",
                        "image": "microsoft/azure-vote-front:v1",
                        "ports": [{ "containerPort": 80, "protocol": "TCP" }],
                        "env": [{ "name": "REDIS", "value": "azure-vote-back" }],
                        "resources": { "limits": { "cpu": "500m" }, "requests": { "cpu": "250m" } },
                        "terminationMessagePath": "/dev/termination-log",
                        "terminationMessagePolicy": "File",
                        "imagePullPolicy": "IfNotPresent"
                    }],
                    "restartPolicy": "Always",
                    "terminationGracePeriodSeconds": 30,
                    "dnsPolicy": "ClusterFirst",
                    "securityContext": {},
                    "schedulerName": "default-scheduler"
                }
            }
        } as any,
        "status": { "replicas": 6, "fullyLabeledReplicas": 6, "readyReplicas": 6, "availableReplicas": 6, "observedGeneration": 3 } as any
    } as V1ReplicaSet;

    it("Check header of the WorkloadDetails component", () => {
        const wrapper = shallow(<WorkloadDetails
            item={item}
            parentKind={"ReplicaSet"}
            itemTypeKey={SelectedItemKeys.ReplicaSetKey}
            getStatusProps={(item) => {
                return { statusProps: Statuses.Success, podsTooltip: "", pods: "" };
            }}
        />);
        const pageClass = ".workload-details-page";

        const pageContainer = wrapper.find(pageClass);
        expect(pageContainer && pageContainer.length > 0).toBeTruthy();

        const heading = wrapper.find("PageTopHeader");
        expect(heading && heading.length > 0).toBeTruthy();
        expect(heading.prop("title")).toStrictEqual(item.metadata.name);
        expect(heading.prop("className")).toStrictEqual("wl-header");
    });

    it("Check WorkloadDetails component after mount", () => {
        const wrapper = mount(<WorkloadDetails
            item={item}
            parentKind={"ReplicaSet"}
            itemTypeKey={SelectedItemKeys.ReplicaSetKey}
            getStatusProps={(item) => {
                return { statusProps: Statuses.Failed, podsTooltip: "", pods: "" };
            }}
        />);

        const pageContent = wrapper.find(".workload-details-page-content");
        expect(pageContent && pageContent.length > 0).toBeTruthy();

        const detailsCard = wrapper.find(".workload-details-card");
        expect(detailsCard && detailsCard.length > 0).toBeTruthy();

        const wlDetails = wrapper.find(".workload-full-details-table");
        expect(wlDetails && wlDetails.length > 0).toBeTruthy();
    });
});