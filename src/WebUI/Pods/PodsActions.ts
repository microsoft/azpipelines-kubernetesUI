/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionsHubBase, Action } from "../FluxCommon/Actions";
import { V1PodList } from "@kubernetes/client-node";

export interface IPodsPayload {
    podsList: V1PodList;
    isLoading: boolean;
}

export interface IPodListWithLabel extends IPodsPayload {
    labelSelector: string;
}

export class PodsActions extends ActionsHubBase {
    public static getKey(): string {
        return "pods-actions";
    }

    public initialize(): void {
        this._podsFetched = new Action<IPodsPayload>();
        this._podsFetchedByLabel = new Action<IPodListWithLabel>();
    }

    public get podsFetched(): Action<IPodsPayload> {
        return this._podsFetched;
    }

    public get podsFetchedByLabel(): Action<IPodListWithLabel> {
        return this._podsFetchedByLabel;
    }

    private _podsFetched: Action<IPodsPayload>;
    private _podsFetchedByLabel: Action<IPodListWithLabel>;
}
