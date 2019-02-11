/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { StoreBase } from "../FluxCommon/Store";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { V1PodList, V1Pod } from "@kubernetes/client-node";
import { PodsActions } from "./PodsActions";
import { PodsEvents } from "../Constants";

export interface IPodsStoreState {
    podsList?: V1PodList;
}

export class PodsStore extends StoreBase {
    public static getKey(): string {
        return "pods-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._state = { podsList: undefined };

        this._actions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);
        this._actions.podsFetched.addListener(this._setPodsList);
    }

    public disposeInternal(): void {
        this._actions.podsFetched.removeListener(this._setPodsList);
    }

    public getState(): IPodsStoreState {
        return this._state;
    }

    private _setPodsList = (podsList: V1PodList): void => {
        this._state.podsList = podsList;
        this.emit(PodsEvents.PodsFetchedEvent, this);
    }

    private _state: IPodsStoreState;
    private _actions: PodsActions;
}

