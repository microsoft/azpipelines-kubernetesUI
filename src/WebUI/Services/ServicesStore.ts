/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { StoreBase } from "../FluxCommon/Store";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { V1ServiceList, V1PodList, V1Pod } from "@kubernetes/client-node";
import { ServicesActions } from "./ServicesActions";
import { PodsActions, IPodListWithLabel } from "../Pods/PodsActions";
import { ServicesEvents } from "../Constants";

export interface IServicesStoreState {
    serviceList?: V1ServiceList
    podsList?: V1Pod[];
    isLoading?: boolean;
}

export class ServicesStore extends StoreBase {
    public static getKey(): string {
        return "services-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._state = { serviceList: undefined, podsList: [], isLoading: true };

        this._servicesActions = ActionsHubManager.GetActionsHub<ServicesActions>(ServicesActions);
        this._podsActions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);

        this._servicesActions.servicesFetched.addListener(this._servicesFetched);
        this._podsActions.podsFetchedByLabel.addListener(this._setAssociatedPodsList);
    }

    public disposeInternal(): void {
        this._servicesActions.servicesFetched.removeListener(this._servicesFetched);
        this._podsActions.podsFetchedByLabel.removeListener(this._setAssociatedPodsList);
    }

    public getState(): IServicesStoreState {
        return this._state;
    }

    public getServicesSize(): number {
        return this._state.serviceList && this._state.serviceList.items ? this._state.serviceList.items.length : 0;
    }

    private _servicesFetched = (serviceList: V1ServiceList): void => {
        this._state.serviceList = serviceList;
        this._state.isLoading = false;
        this.emit(ServicesEvents.ServicesFetchedEvent, this);
        if (this._state.serviceList && this._state.serviceList.items && this._state.serviceList.items.length > 0) {
            this.emit(ServicesEvents.ServicesFoundEvent, this);
        }
    }

    private _setAssociatedPodsList = (payload: IPodListWithLabel): void => {
        this._state.podsList = payload.podsList && payload.podsList.items;
        this.emit(ServicesEvents.ServicePodsFetchedEvent, this);
    }

    private _state: IServicesStoreState;
    private _servicesActions: ServicesActions;
    private _podsActions: PodsActions;
}

