/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { KubeFilterBar } from "../Common/KubeFilterBar";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";

export interface IWorkloadsFilterBarProps extends IVssComponentProperties {
    filter: Filter;
    filterToggled: ObservableValue<boolean>,
}

export class WorkloadsFilterBar extends BaseComponent<IWorkloadsFilterBarProps> {
    public render(): React.ReactNode {
        return (<KubeFilterBar filter={this.props.filter}
            keywordPlaceHolder={Resources.WorkloadText.toLocaleLowerCase()} // lowercase to show in filter
            pickListPlaceHolder={Resources.KindText}
            pickListItemsFn={this._pickListItems}
            listItemsFn={this._listItems}
            filterToggled={this.props.filterToggled}
            className={this.props.className || ""}
        />);
    }

    private _pickListItems = () => {
        return [KubeResourceType.Deployments,
        KubeResourceType.ReplicaSets,
        KubeResourceType.DaemonSets,
        KubeResourceType.StatefulSets];
    };

    private _listItems = (item: any) => {
        let name: string = "";
        switch (item) {
            case KubeResourceType.Deployments:
                name = Resources.DeploymentsDetailsText;
                break;
            case KubeResourceType.ReplicaSets:
                name = Resources.ReplicaSetText;
                break;
            case KubeResourceType.DaemonSets:
                name = Resources.DaemonSetText;
                break;
            case KubeResourceType.StatefulSets:
                name = Resources.StatefulSetText;
                break;
        };
        return {
            key: item.toString(),
            name: name
        };
    };
}