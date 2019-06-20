import { V1Service } from "@kubernetes/client-node";
import * as String_Utils from "azure-devops-ui/Core/Util/String";
import { Statuses } from "azure-devops-ui/Status";
import * as React from "react";
import { ServiceDetails } from "../../../src/WebUI/Services/ServiceDetails";
import { IServiceItem } from "../../../src/WebUI/Types";
import { mount, shallow } from "../../TestCore";

describe("ServiceDetails component tests", () => {

    const name = "some package name" + String_Utils.newGuid();
    const uid = "f32f9f29-ebed-11e8-ac56-829606b05f65";
    const createdDate = new Date(2015, 10, 10);
    const serviceObj = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "annotations": {
                "kubectl.kubernetes.io/last-applied-configuration": "some annotation"
            },
            "creationTimestamp": createdDate,
            "name": name,
            "namespace": "some-namespace",
            "uid": uid
        },
        "spec": {
            "clusterIP": "10.0.93.21",
            "externalTrafficPolicy": "Cluster",
            "ports": [
                {
                    "nodePort": 30474,
                    "port": 80,
                    "protocol": "TCP",
                    "targetPort": 80
                }
            ],
            "selector": {
                "app": "test-app-one"
            },
            "sessionAffinity": "None",
            "type": "LoadBalancer"
        },
        "status": {
            "loadBalancer": {
                "ingress": [
                    {
                        "ip": "52.163.187.200"
                    }
                ]
            }
        }
    } as any;

    const item = {
        package: name,
        type: "type",
        clusterIP: "clusterIp",
        externalIP: "externalIp",
        port: "port",
        uid: uid,
        creationTimestamp: createdDate,
        service: serviceObj as V1Service
    } as IServiceItem;

    it("Check header of the ServiceDetails component", () => {
        const wrapper = shallow(<ServiceDetails service={item} parentKind={"Service"} />);
        const pageClass = ".service-details-page";

        const pageContainer = wrapper.find(pageClass);
        expect(pageContainer && pageContainer.length > 0).toBeTruthy();

        const heading = wrapper.find("PageTopHeader");
        expect(heading && heading.length > 0).toBeTruthy();
        expect(heading.prop("title")).toStrictEqual(item.package);
        expect(heading.prop("className")).toStrictEqual("s-details-header");
        const statusProps = item.type === "LoadBalancer" && !item.externalIP ? Statuses.Running : Statuses.Success;
        expect(heading.prop("statusProps")).toStrictEqual(statusProps);
    });

    it("Check service ServiceDetails component after mount", () => {
        const wrapper = mount(<ServiceDetails service={item} parentKind={"Service"} />);

        const pageContent = wrapper.find(".service-details-page-content");
        expect(pageContent && pageContent.length > 0).toBeTruthy();

        const sTableKeys = wrapper.find(".service-details-card");
        expect(sTableKeys && sTableKeys.length > 0).toBeTruthy();

        const sDetails = wrapper.find(".service-full-details-table");
        expect(sDetails && sDetails.length > 0).toBeTruthy();
    });
});