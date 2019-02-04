import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { PickListFilterBarItem, IPickListItem } from "azure-devops-ui/PickList";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { localeFormat } from "azure-devops-ui/Core/Util/String";

export const NameKey: string = "nameKey";
export const TypeKey: string = "typeKey";

// copied from office-ui-fabric-react to avoid inclusion of the whole package of fabric-ui
enum SelectionMode {
    none = 0,
    single = 1,
    multiple = 2,
}

export interface IFilterComponentProperties extends IVssComponentProperties {
    filter: Filter,
    keywordPlaceHolder: string,
    pickListPlaceHolder: string,
    filterToggled:ObservableValue<boolean>,
    pickListItemsFn: () => any[];
    listItemsFn: (item:any) => IPickListItem;
}

export class FilterComponent extends BaseComponent<IFilterComponentProperties, {}> {

    public render(): React.ReactNode {
        return (
            <ConditionalChildren renderChildren={this.props.filterToggled}>
                <FilterBar filter={this.props.filter}>
                    <KeywordFilterBarItem filterItemKey={NameKey} placeholder={localeFormat(Resources.FindByNameText, this.props.keywordPlaceHolder.toLowerCase())} />
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
