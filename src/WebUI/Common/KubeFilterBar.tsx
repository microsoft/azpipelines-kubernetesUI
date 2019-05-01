/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { IListSelection } from "azure-devops-ui/List";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";

/* Including from office-ui-fabric-react to avoid direct dependency on office-ui-fabric-react */
enum SelectionMode {
    none = 0,
    single = 1,
    multiple = 2,
}

export const NameKey: string = "nameKey";
export const TypeKey: string = "typeKey";

export interface IFilterComponentProperties extends IVssComponentProperties {
    filter: Filter;
    keywordPlaceHolder: string;
    pickListPlaceHolder: string;
    filterToggled: ObservableValue<boolean>;
    selection: IListSelection;
    listItems: IListBoxItem<{}>[];
    addBottomPadding?: boolean;
}

export class KubeFilterBar extends React.Component<IFilterComponentProperties, {}> {

    public render(): React.ReactNode {
        return (
            <ConditionalChildren renderChildren={this.props.filterToggled}>
                <FilterBar filter={this.props.filter} className={this.props.className || ""}>
                    <KeywordFilterBarItem filterItemKey={NameKey} className={"keyword-search"} placeholder={localeFormat(Resources.FindByNameText, this.props.keywordPlaceHolder)} />
                    <DropdownFilterBarItem
                        placeholder={this.props.pickListPlaceHolder}
                        showPlaceholderAsLabel={true}
                        filterItemKey={TypeKey}
                        selection={this.props.selection}
                        noItemsText={Resources.NoItemsText}
                        items={this.props.listItems}
                    />
                </FilterBar>
                {this.props.addBottomPadding && <div className="page-content-top" />}
            </ConditionalChildren>
        );
    }
}
