/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { StoreBase } from "../FluxCommon/Store";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { V1PodList, V1Pod } from "@kubernetes/client-node";
import { PodsActions, IPodListWithLabel, IPodsPayload } from "./PodsActions";
import { PodsEvents } from "../Constants";

export interface IPodsStoreState {
    podsList?: V1PodList;
    podsLoading?: boolean;
    podListByLabel: { [label: string]: V1PodList };
}

export class PodsStore extends StoreBase {
    public static getKey(): string {
        return "pods-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._state = { podsList: undefined, podListByLabel: {}, podsLoading: true };

        this._actions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);
        this._actions.podsFetched.addListener(this._setPodsList);
        this._actions.podsFetchedByLabel.addListener(this._setPodsListByLabel);
    }

    public disposeInternal(): void {
        this._actions.podsFetched.removeListener(this._setPodsList);
        this._actions.podsFetchedByLabel.removeListener(this._setPodsListByLabel);
    }

    public getState(): IPodsStoreState {
        return this._state;
    }

    private _setPodsList = (payload: IPodsPayload): void => {
        this._state.podsList = payload.podsList;
        this._state.podsLoading = payload.podsLoading;
        this.emit(PodsEvents.PodsFetchedEvent, this);
    }

    private _setPodsListByLabel = (payload: IPodListWithLabel): void => {
        this._state.podListByLabel[payload.labelSelector] = payload.podsList;
        this._state.podsLoading = payload.podsLoading;
        this.emit(PodsEvents.LabelledPodsFetchedEvent, this);
    }

    private _state: IPodsStoreState;
    private _actions: PodsActions;
}

