import * as React from "react";
import { shallow } from "enzyme";
import { ServiceComponent } from "../../../src/WebUI/Components/ServiceComponent";
import { IServiceItem } from "../../../src/WebUI/Types";
import { initializeAdapter } from "../../InitializeAdapter";
import * as Resources from "../../../src/WebUI/Resources";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import * as String_Utils from "azure-devops-ui/Core/Util/String";
import { V1Service, V1ObjectMeta } from "@kubernetes/client-node";

beforeAll(() => initializeAdapter());

describe("ServiceComponent component tests", () => {
    it("Check header of the component", () => {
        const name = "some package name" + String_Utils.newGuid();
        const createdDate = new Date(2015, 10, 10);
        const serviceObj: V1Service = {
            apiVersion: "v1",
            kind: "Service",
            metadata: {
                annotations: {
                    "kubectl.kubernetes.io/last-applied-configuration": "{\"apiVersion\":\"v1\",\"kind\":\"Service\",\"metadata\":{\"annotations\":{},\"name\":\"azure-vote-front\",\"namespace\":\"madhuv-n1\"},\"spec\":{\"ports\":[{\"port\":80}],\"selector\":{\"app\":\"azure-vote-front\"},\"type\":\"LoadBalancer\"}}\n"
                },
                creationTimestamp: createdDate,
                name: name,
                namespace: "madhuv-n1",
                resourceVersion: "1083",
                selfLink: "/api/v1/namespaces/madhuv-n1/services/azure-vote-front",
                uid: "f32f9f29-ebed-11e8-ac56-829606b05f65"
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
        const item = { package: name, type: "type", clusterIP: "clusterIp", externalIP: "externalIp", port: "port", uid: "f32f9f29-ebed-11e8-ac56-829606b05f65", creationTimestamp: createdDate, service: serviceObj as V1Service} as IServiceItem;
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

        // service details should not exist --> service property is not provided
        const service = wrapper.find(".service-main-content .s-details");
        expect(!!service && service.length > 0).toBeTruthy();
    });
});