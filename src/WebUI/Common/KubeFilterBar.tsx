import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { SelectionMode } from "office-ui-fabric-react/lib/Selection";
import { PickListFilterBarItem, IPickListItem } from "azure-devops-ui/PickList";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";

export const NameKey: string = "nameKey";
export const TypeKey: string = "typeKey";

export interface IFilterComponentProperties extends IVssComponentProperties {
    filter: Filter,
    keywordPlaceHolder: string,
    pickListPlaceHolder: string,
    filterToggled:ObservableValue<boolean>,
    pickListItemsFn: () => any[];
    listItemsFn: (item:any) => IPickListItem;
}

export class KubeFilterBar extends BaseComponent<IFilterComponentProperties, {}> {

    public render(): React.ReactNode {
        return (
            <ConditionalChildren renderChildren={this.props.filterToggled}>
                <FilterBar filter={this.props.filter}>
                    <KeywordFilterBarItem filterItemKey={NameKey} placeholder={format(Resources.FindByNameText, this.props.keywordPlaceHolder.toLowerCase())} />
                    <PickListFilterBarItem
                        placeholder={this.props.pickListPlaceHolder}
                        showPlaceholderAsLabel={true}
                        filterItemKey={TypeKey}
                        selectionMode={SelectionMode.multiple}
                        noItemsText={Resources.NoItemsText}
                        showSelectAll={false}
                        hideClearButton={false}
                        getPickListItems={this.props.pickListItemsFn}
                        getListItem={this.props.listItemsFn}
                    />
                </FilterBar>
            </ConditionalChildren>
        );
    }
}
