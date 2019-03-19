/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1Pod, V1ReplicaSet, V1StatefulSet } from "@kubernetes/client-node";
import { IImageDetails } from "../../Contracts/Types";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { StoreBase } from "../FluxCommon/Store";
import { IServiceItem } from "../Types";
import { ISelectionPayload, SelectionActions } from "./SelectionActions";

export interface ISelectionStoreState {
    selectedItem: V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem | V1Pod | IImageDetails | undefined;
    showSelectedItem: boolean;
    selectedItemType: string;
}

export class SelectionStore extends StoreBase {
    public static getKey(): string {
        return "kubernetes-selection-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._state = { selectedItem: undefined, showSelectedItem: false, selectedItemType: "" };

        this._actions = ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions);
        this._actions.selectItem.addListener(this._select);
    }

    public disposeInternal(): void {
        this._actions.selectItem.removeListener(this._select);
    }

    public getState(): ISelectionStoreState {
        return this._state;
    }

    private _select = (payload: ISelectionPayload): void => {
        this._state.selectedItem = payload.item;
        this._state.showSelectedItem = payload.showSelectedItem;
        this._state.selectedItemType = payload.selectedItemType;
        this.emitChanged();
    }

    private _state: ISelectionStoreState;
    private _actions: SelectionActions;
}

