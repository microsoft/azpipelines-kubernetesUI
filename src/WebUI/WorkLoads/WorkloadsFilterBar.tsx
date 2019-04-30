/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/


import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { KubeFilterBar } from "../Common/KubeFilterBar";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { IListSelection, ListSelection } from "azure-devops-ui/List";

export interface IWorkloadsFilterBarProps extends IVssComponentProperties {
    filter: Filter;
    filterToggled: ObservableValue<boolean>;
}

export class WorkloadsFilterBar extends React.Component<IWorkloadsFilterBarProps> {
    public render(): React.ReactNode {
        const items: IListBoxItem<{}>[] = [
            { id: KubeResourceType.Deployments.toString(), text: Resources.DeploymentsDetailsText },
            { id: KubeResourceType.ReplicaSets.toString(), text: Resources.ReplicaSetText },
            { id: KubeResourceType.DaemonSets.toString(), text: Resources.DaemonSetText },
            { id: KubeResourceType.StatefulSets.toString(), text: Resources.StatefulSetText }
        ];

        return (<KubeFilterBar filter={this.props.filter}
            keywordPlaceHolder={Resources.WorkloadText.toLocaleLowerCase()} // lowercase to show in filter
            pickListPlaceHolder={Resources.KindText}
            listItems={items}
            filterToggled={this.props.filterToggled}
            className={this.props.className || ""}
            addBottomPadding={true}
            selection={this._selection}
        />);
    }

    private _selection: IListSelection = new ListSelection(true);

}