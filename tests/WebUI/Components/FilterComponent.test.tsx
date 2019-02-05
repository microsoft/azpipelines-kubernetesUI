import * as React from "react";

import { FilterComponent, NameKey, TypeKey, IFilterComponentProperties } from "../../../src/WebUI/Components/FilterComponent";
import { mount } from "../../TestCore";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { ObservableValue } from "azure-devops-ui/Core/Observable";

describe("Filter component unit tests", () => {
    it("filter bar should not render when toggled false", () => {
        let filter: Filter = new Filter();
        const props: IFilterComponentProperties = {
            filter: filter,
            filterToggled: new ObservableValue<boolean>(false),
            pickListPlaceHolder:"CHeck",
            keywordPlaceHolder:"Test",
            pickListItemsFn: () => { return ['testitem1', 'testitem2'] },
            listItemsFn: (item) => {
                return {
                    key: item,
                    name: item
                }
            }
        }

        const wrapper = mount(<FilterComponent {...props} />)
        const filterBarCss = ".vss-FilterBar";
        const heading = wrapper.find(filterBarCss);
        expect(!!heading && heading.length > 0).toBeFalsy();
    });

    it("filter bar should render when toggled true", () => {
        let filter: Filter = new Filter();
        const props: IFilterComponentProperties = {
            filter: filter,
            filterToggled: new ObservableValue<boolean>(true),
            pickListPlaceHolder: "CHeck",
            keywordPlaceHolder: "Test",
            pickListItemsFn: () => { return ['testitem1', 'testitem2'] },
            listItemsFn: (item) => {
                return {
                    key: item,
                    name: item
                }
            }
        }

        const wrapper = mount(<FilterComponent {...props} />)
        const filterBarCss = ".vss-FilterBar";
        const heading = wrapper.find(filterBarCss);
        expect(!!heading && heading.length > 0).toBeTruthy();
    });
})
