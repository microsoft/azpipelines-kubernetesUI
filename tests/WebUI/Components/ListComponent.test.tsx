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
        const heading = wrapper.find("HeaderTitle");
        expect(!!heading && heading.length > 0).toBeTruthy();
    });
});