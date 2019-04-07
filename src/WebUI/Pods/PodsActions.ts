/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionsHubBase, Action } from "../FluxCommon/Actions";
import { V1PodList } from "@kubernetes/client-node";

export interface IPodListWithLabel {
    labelSelector: string;
    podsList: V1PodList;
}

export class PodsActions extends ActionsHubBase {
    public static getKey(): string {
        return "pods-actions";
    }

    public initialize(): void {
        this._podsFetched = new Action<V1PodList>();
        this._podsFetchedByLabel = new Action<IPodListWithLabel>();
    }

    public get podsFetched(): Action<V1PodList> {
        return this._podsFetched;
    }

    public get podsFetchedByLabel(): Action<IPodListWithLabel> {
        return this._podsFetchedByLabel;
    }

    private _podsFetched: Action<V1PodList>;
    private _podsFetchedByLabel: Action<IPodListWithLabel>;
}
