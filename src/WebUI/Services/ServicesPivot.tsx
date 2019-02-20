/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ServiceList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import "../Common/KubeSummary.scss";
import { ServicesTable } from "../Services/ServicesTable";
import { KubeZeroData } from "../Common//KubeZeroData";
import { Filter, IFilterState, IFilterItemState } from "azure-devops-ui/Utilities/Filter";
import { ServicesFilterBar } from "./ServicesFilterBar";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ServicesActionsCreator } from "./ServicesActionsCreator";
import { ServicesStore } from "./ServicesStore";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ServicesEvents } from "../Constants";
import { NameKey, TypeKey } from "../Common/KubeFilterBar";

export interface IServicesPivotState {
    serviceList?: V1ServiceList;
}

export interface IServicesPivotProps extends IVssComponentProperties {
    kubeService: IKubeService;
    filter: Filter;
    namespace?: string;
    filterToggled: ObservableValue<boolean>;
}

export class ServicesPivot extends BaseComponent<IServicesPivotProps, IServicesPivotState> {
    constructor(props: IServicesPivotProps) {
        super(props, {});

        this._actionCreator = ActionsCreatorManager.GetActionCreator<ServicesActionsCreator>(ServicesActionsCreator);
        this._store = StoreManager.GetStore<ServicesStore>(ServicesStore);

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
            serviceList={this.state.serviceList || {} as V1ServiceList}
            filter={this.props.filter}
            filterToggled={this.props.filterToggled}
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