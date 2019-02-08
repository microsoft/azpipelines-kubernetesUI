/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionsHubBase, Action } from "../FluxCommon/Actions";
import { V1ServiceList, V1PodList } from "@kubernetes/client-node";

export class ServicesActions extends ActionsHubBase {
    public static getKey(): string {
        return "services-actions";
    }

    public initialize(): void {
        this._servicesFetched = new Action<V1ServiceList>();
    }

    public get servicesFetched(): Action<V1ServiceList> {
        return this._servicesFetched;
    }

    private _servicesFetched: Action<V1ServiceList>;
}
