/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ServiceList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter, IFilterItemState, IFilterState } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { IKubeService, KubeImage } from "../../Contracts/Contracts";
import { KubeZeroData, IKubeZeroDataProps } from "../Common//KubeZeroData";
import { NameKey, TypeKey } from "../Common/KubeFilterBar";
import "../Common/KubeSummary.scss";
import { ServicesEvents, HyperLinks } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import * as Resources from "../Resources";
import { ServicesTable } from "../Services/ServicesTable";
import { IVssComponentProperties } from "../Types";
import { ServicesActionsCreator } from "./ServicesActionsCreator";
import { ServicesFilterBar } from "./ServicesFilterBar";
import { ServicesStore } from "./ServicesStore";
import "./ServicesPivot.scss";
import { KubeFactory } from "../KubeFactory";
import { KubeSummary } from "../Common/KubeSummary";

export interface IServicesPivotState {
    serviceList?: V1ServiceList;
}

export interface IServicesPivotProps extends IVssComponentProperties {
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

        this._actionCreator.getServices(KubeSummary.getKubeService());
        this._store.addListener(ServicesEvents.ServicesFetchedEvent, this._onServicesFetched);
    }

    public render(): React.ReactNode {
        return (
            <div className="services-pivot">
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
        return (serivceSize === 0 ? this._getZeroData() :
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

    private _getZeroData(): JSX.Element{
        const zeroDataProps: IKubeZeroDataProps = {
            imagePath: KubeFactory.getImageLocation(KubeImage.zeroWorkloads),
            hyperLink: HyperLinks.ServicesLink,
            hyperLinkLabel: Resources.LearnMoreText,
            primaryText: Resources.DeployServices,
            descriptionText: Resources.StartingUsingServiceText,
            className: "zerod-side-align-content"
        }
        return (KubeZeroData.getDefaultZeroData(zeroDataProps));
    }

    private _store: ServicesStore;
    private _actionCreator: ServicesActionsCreator;
}