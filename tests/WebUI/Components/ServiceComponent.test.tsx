import { V1Service } from "@kubernetes/client-node";
import * as String_Utils from "azure-devops-ui/Core/Util/String";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import * as React from "react";

import { ServiceComponent } from "../../../src/WebUI/Components/ServiceComponent";
import * as Resources from "../../../src/WebUI/Resources";
import { IServiceItem } from "../../../src/WebUI/Types";
import { mount, shallow } from "../../TestCore";

describe("ServiceComponent component tests", () => {

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
            "namespace": "madhuv-n1",
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
                "app": "azure-vote-front"
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

    it("Check header of the component", () => {
        const wrapper = shallow(<ServiceComponent service={item} />);
        const agoText = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
        const headingClass = ".service-main-content .content-main-heading";

        // check all header details
        const heading = wrapper.find(headingClass + " .title-heading");
        expect(!!heading && heading.length > 0).toBeTruthy();
        expect(heading.text()).toStrictEqual(name);

        const subHeading = wrapper.find(headingClass + " .sub-heading");
        expect(!!subHeading && subHeading.length > 0).toBeTruthy();
        expect(subHeading.text()).toStrictEqual(String_Utils.localeFormat(Resources.ServiceCreatedText, agoText));

        // check service details
        const serviceClass = ".service-main-content .s-details";
        const sHeader = wrapper.find(serviceClass + " .s-de-heading");
        expect(!!sHeader && sHeader.length > 0).toBeTruthy();
        expect(sHeader.text()).toStrictEqual(Resources.DetailsText);
        const sTable = wrapper.find(serviceClass + " .s-full-details");
        expect(!!sTable && sTable.length > 0).toBeTruthy();
    });

    it("Check header when no service is available", () => {
        const itemLocal = { ...item, service: null };
        const wrapper = shallow(<ServiceComponent service={itemLocal} />);
        const headingClass = ".service-main-content .content-main-heading";

        // check header --> should exist
        const header = wrapper.find(headingClass);
        expect(!!header && header.length > 0).toBeTruthy();

        // service details should not exist --> service property is not provided
        const service = wrapper.find(".service-main-content .s-details");
        expect(!service || service.length === 0).toBeTruthy();
    });

    it("Check service component after mount", () => {
        const wrapper = mount(<ServiceComponent service={item} />);
        const sTableKeys = wrapper.find(".service-main-content .s-details .s-full-details .s-key");
        expect(!!sTableKeys && sTableKeys.length > 0).toBeTruthy();
        expect(sTableKeys.length).toStrictEqual(7);
    });
});