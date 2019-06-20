import * as React from "react";

import { ITableComponentProperties, KubeCardWithTable } from "../../../src/WebUI/Common/KubeCardWithTable";
import { shallow } from "../../TestCore";

describe("KubeCardWithTable component tests", () => {
    it("Check header of the KubeCardWithTable component", () => {
        const props: ITableComponentProperties<any> = {
            headingText: "Heading",
            columns: [],
            items: [],
            onRenderItemColumn: () => null
        };

        const wrapper = shallow(<KubeCardWithTable {...props} />);
        const heading = wrapper.find("HeaderTitle");
        expect(heading && heading.length > 0).toBeTruthy();
    });
});