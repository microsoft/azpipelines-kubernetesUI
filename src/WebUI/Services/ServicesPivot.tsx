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
import { KubeZeroData } from "../Common//KubeZeroData";
import { Filter, IFilterState, FILTER_CHANGE_EVENT, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { ServicesFilterBar } from "./ServicesFilterBar";
import { Tab, TabBar, TabContent } from "azure-devops-ui/Tabs";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { HeaderCommandBarWithFilter } from 'azure-devops-ui/HeaderCommandBar';
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { SelectedItemKeys } from "../Constants";
import { PodDetailsView } from "../Pods/PodDetailsView";
import { ServicesActionsCreator } from "./ServicesActionsCreator";
import { IServicesStoreState, ServicesStore } from "./ServicesStore";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ServicesEvents } from "../Constants";
import { NameKey, TypeKey } from "../Common/KubeFilterBar";

const workloadsPivotItemKey: string = "workloads";
const servicesPivotItemKey: string = "services";
const filterToggled = new ObservableValue<boolean>(false);

export interface IServicesPivotState {
    serviceList?: V1ServiceList;
}

export interface IWorkloadsPivotProps extends IVssComponentProperties {
    kubeService: IKubeService;
    filter: Filter;
    namespace?: string;
}

export class ServicesPivot extends BaseComponent<IWorkloadsPivotProps, IServicesPivotState> {
    constructor(props: IWorkloadsPivotProps) {
        super(props, {});

        this._actionCreator = ActionsCreatorManager.GetActionCreator<ServicesActionsCreator>(ServicesActionsCreator);
        this._store = StoreManager.GetStore<ServicesStore>(ServicesStore);

        const filter = new Filter();
        this.state = {
            serviceList: undefined
        };

        this._actionCreator.getServices(this.props.kubeService);
        this._store.addListener(ServicesEvents.ServicesFetchedEvent, this._onServicesFetched);
    }

    public render(): React.ReactNode {
        return (
            <div className="item-padding">
                {this._getFilterBar()}
                {this._getContent()}
            </div>
        );
    }

    public componentWillUnmount(): void {
        this._store.removeListener(ServicesEvents.ServicesFetchedEvent, this._onServicesFetched);
    }

    private _onServicesFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({ serviceList: storeState.serviceList });
    }

    private _getContent(): JSX.Element {
        const serivceSize: number = this.state.serviceList && this.state.serviceList.items ? this.state.serviceList.items.length : 0;
        return (serivceSize === 0 ?
            KubeZeroData._getDefaultZeroData("https://kubernetes.io/docs/concepts/services-networking/service/",
                Resources.LearnMoreText, Resources.NoServicesText, Resources.CreateServiceText)
            :
            <ServicesTable
                serviceList={this.state.serviceList || {} as V1ServiceList}
                nameFilter={this._getNameFilterValue()}
                typeSelections={this._getTypeFilterValue()}
            />);
    }

    private _getFilterBar(): JSX.Element {
        return (<ServicesFilterBar
            servicesList={this.state.serviceList || {} as V1ServiceList}
            filter={this.props.filter}
            filterToggled={filterToggled}
        />);
    }

    private _getNameFilterValue(): string | undefined {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[NameKey] : null;
        return filterItem ? (filterItem.value as string) : undefined;
    }

    private _getTypeFilterValue(): any[] {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[TypeKey] : null;
        const selections: any[] = filterItem ? filterItem.value : [];
        return selections;
    }

    private _store: ServicesStore;
    private _actionCreator: ServicesActionsCreator;
}