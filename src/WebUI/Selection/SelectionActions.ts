/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionsHubBase, Action } from "../FluxCommon/Actions";
import { V1ReplicaSet, V1Pod, V1DaemonSet, V1StatefulSet } from "@kubernetes/client-node";
import { IServiceItem } from "../Types";

export interface ISelectionPayload {
    item: V1ReplicaSet | V1DaemonSet | V1StatefulSet | IServiceItem | V1Pod;
    showSelectedItem: boolean;
    selectedItemType: string;
}

export class SelectionActions extends ActionsHubBase {
    public static getKey(): string {
        return "kubernetes-selection-actions";
    }

    public initialize(): void {
        this._selectItem = new Action<ISelectionPayload>();
    }


    public get selectItem(): Action<ISelectionPayload> {
        return this._selectItem;
    }

    private _selectItem: Action<ISelectionPayload>;
}
