import { V1Service } from "@kubernetes/client-node";
import * as String_Utils from "azure-devops-ui/Core/Util/String";
import * as React from "react";
import { ServiceDetails } from "../../../src/WebUI/Services/ServiceDetails";
import { IServiceItem } from "../../../src/WebUI/Types";
import { mount } from "../../TestCore";
import { MockKubeService } from "../MockKubeService";

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

    const kubeService = new MockKubeService();

    /*
    it("Check header of the component", () => {
        const wrapper = shallow(<ServiceDetails service={item} parentKind={"Service"} />);
        const agoText = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
        const headingClass = ".service-main-content .content-main-heading";

        // check all header details
        const headingContainer = wrapper.find(headingClass);
        expect(!!headingContainer && headingContainer.length > 0).toBeTruthy();

        const heading = wrapper.find("ResourceStatus");
        expect(!!heading && heading.length > 0).toBeTruthy();
        //large status size
        expect(heading.prop("statusSize")).toStrictEqual("24");

        const renderedHeading = heading.dive();

        const status = renderedHeading.find("Status");
        expect(!!status && status.length > 0).toBeTruthy();
        expect(status.prop("color")).toStrictEqual("success")

        const pageTitle = renderedHeading.find("Header");
        expect(!!pageTitle && pageTitle.length > 0).toBeTruthy();
        expect(pageTitle.prop("title")).toStrictEqual(item.package);
    });

    it("Check header when no service is available", () => {
        const itemLocal = { ...item, service: null };
        const wrapper = shallow(<ServiceDetails service={itemLocal} parentKind={"Service"} />);
        const headingClass = ".service-main-content .content-main-heading";

        // check header --> should exist
        const header = wrapper.find(headingClass);
        expect(!!header && header.length > 0).toBeTruthy();

        // service details should not exist --> service property is not provided
        const service = wrapper.find(".service-main-content .s-details");
        expect(!service || service.length === 0).toBeTruthy();
    });
    */

    it("Check service component after mount", () => {
        const wrapper = mount(<ServiceDetails service={item} parentKind={"Service"} />);
        const sTableKeys = wrapper.find(".service-details-card");
        expect(!!sTableKeys && sTableKeys.length > 0).toBeTruthy();
    });
});