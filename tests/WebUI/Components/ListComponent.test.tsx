import * as React from "react";

import { ITableComponentProperties, BaseKubeTable } from "../../../src/WebUI/Common/BaseKubeTable";
import { shallow } from "../../TestCore";

describe("ListComponent component tests", () => {
    it("Check header of the component", () => {
        const props: ITableComponentProperties<any> = {
            headingText: "Heading",
            columns: [],
            items: [],
            onRenderItemColumn: () => null
        };

        const wrapper = shallow(<BaseKubeTable {...props} />);
        const headingClass = ".kube-list-content .kube-list-heading.heading";
        const heading = wrapper.find(headingClass);
        expect(!!heading && heading.length > 0).toBeTruthy();

        const listClass = ".kube-list-content .kube-list";
        const list = wrapper.find(headingClass);
        expect(!!list && list.length > 0).toBeTruthy();
    });
});