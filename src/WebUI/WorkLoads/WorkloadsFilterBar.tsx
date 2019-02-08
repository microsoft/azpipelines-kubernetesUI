/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DeploymentList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList, V1DaemonSetList, V1StatefulSetList, V1Service, V1PodList, V1Pod, V1DaemonSet, V1StatefulSet, V1PodTemplateSpec, V1ObjectMeta } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IVssComponentProperties, IServiceItem, IDeploymentReplicaSetItem } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsTable } from "../Workloads/DeploymentsTable";
import "../Common/KubeSummary.scss";
import { ServiceDetailsView } from "../Services/ServiceDetailsView";
import { ServicesTable } from "../Services/ServicesTable";
// todo :: work around till this issue is fixed in devops ui
import "azure-devops-ui/Label.scss";
import { DaemonSetTable } from "../Workloads/DaemonSetTable";
import { StatefulSetTable } from "../Workloads/StatefulSetTable";
import { PodsTable } from "../Pods/PodsTable";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { KubeFilterBar, NameKey, TypeKey } from "../Common/KubeFilterBar";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { SelectedItemKeys } from "../Constants";
import { PodDetailsView } from "../Pods/PodDetailsView";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const filterToggled = new ObservableValue<boolean>(false);

export interface IWorkloadsFilterBarProps extends IVssComponentProperties {
    filter: Filter;
    filterToggled: ObservableValue<boolean>,
}

export class WorkloadsFilterBar extends BaseComponent<IWorkloadsFilterBarProps> {
    public render(): React.ReactNode {
        return (<KubeFilterBar filter={this.props.filter}
            keywordPlaceHolder={Resources.PivotWorkloadsText}
            pickListPlaceHolder={Resources.KindText}
            pickListItemsFn={this._pickListItems}
            listItemsFn={this._listItems}
            filterToggled={this.props.filterToggled}
        />);
    }

    private _pickListItems = () => {
        return [KubeResourceType.Deployments,
        KubeResourceType.ReplicaSets,
        KubeResourceType.DaemonSets,
        KubeResourceType.StatefulSets,
        KubeResourceType.Pods];
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
            case KubeResourceType.Pods:
                name = Resources.PodsText;
                break;
        };
        return {
            key: item.toString(),
            name: name
        };
    };
}