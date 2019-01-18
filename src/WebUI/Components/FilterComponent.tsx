import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { SelectionMode } from "office-ui-fabric-react/lib/Selection";
import { PickListFilterBarItem, IPickListItem } from "azure-devops-ui/PickList";
import { Filter } from "azure-devops-ui/Utilities/Filter";

export interface IFilterComponentProperties extends IVssComponentProperties {
    filter: Filter,
    keywordPlaceHolder: string,
    pickListPlaceHolder: string,
    pickListItemsFn: () => any[];
    listItemsFn: (item:any) => IPickListItem;
}

export class FilterComponent extends BaseComponent<IFilterComponentProperties, {}> {

    public render(): React.ReactNode {
        return (
            <FilterBar filter={this.props.filter} >
                <KeywordFilterBarItem filterItemKey="nameKey" placeholder={format(Resources.FindByNameText, this.props.keywordPlaceHolder)} />
                <PickListFilterBarItem
                    placeholder={this.props.pickListPlaceHolder}
                    showPlaceholderAsLabel={true}
                    filterItemKey="typeKey"
                    selectionMode={SelectionMode.multiple}
                    noItemsText="No items found"
                    showSelectAll={false}
                    hideClearButton={false}
                    getPickListItems={this.props.pickListItemsFn}
                    getListItem={this.props.listItemsFn}
                />
            </FilterBar>
        );
    }
}
