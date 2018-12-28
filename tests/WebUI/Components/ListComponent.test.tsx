import * as React from "react";

import { IListComponentProperties, ListComponent } from "../../../src/WebUI/Components/ListComponent";
import { shallow } from "../../TestCore";

describe("ListComponent component tests", () => {
    it("Check header of the component", () => {
        const props: IListComponentProperties<any> = {
            headingText: "Heading",
            columns: [],
            items: [],
            onRenderItemColumn: () => null
        };
        const wrapper = shallow(<ListComponent {...props} />);
        const headingClass = ".kube-list-content .kube-list-heading.heading";
        const heading = wrapper.find(headingClass);
        expect(!!heading && heading.length > 0).toBeTruthy();

        const listClass = ".kube-list-content .kube-list";
        const list = wrapper.find(headingClass);
        expect(!!list && list.length > 0).toBeTruthy();
    });
});