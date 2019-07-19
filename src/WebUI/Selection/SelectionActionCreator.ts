/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { createBrowserHistory } from "history";
import * as queryString from "simple-query-string";
import { ActionCreatorBase } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { ISelectionPayload, SelectionActions } from "./SelectionActions";

export class SelectionActionsCreator extends ActionCreatorBase {

    public static getKey(): string {
        return "selection-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions);
    }

    public selectItem(payload: ISelectionPayload): void {
        // Create history service fresh here, because we need the fresh url location
        // Unlike components, action creators are not re initialized on view mount
        const historyService = createBrowserHistory();
        let routeValues = { ...queryString.parse(historyService.location.search) };
        routeValues["type"] = payload.selectedItemType;
        routeValues["uid"] = payload.itemUID;

        if (!!payload.selectedItemType) {
            delete routeValues["view"];
        }

        // This logic needs some refining. We need to plan a course of action that will suit an open source hosting. The host might have its own query parameters
        // So, our design should be careful in handling those
        if (payload.properties) {
            // Add all the non-object, non-function and defined values to the url route. This will be read by the view loading itself
            Object.keys(payload.properties).forEach(pk => {
                const pValue = payload.properties![pk];
                if (pValue !== undefined && pValue !== null && typeof pValue !== "object" && typeof pValue !== "function" && pValue !== "") {
                    routeValues[pk] = pValue;
                }
                else {
                    delete routeValues[pk];
                }
            });
        }

        Object.keys(routeValues).forEach(rk => {
            const paramValue = routeValues[rk];
            // delete the properties which has no value
            if (paramValue === undefined || paramValue === null || paramValue === "") {
                // do not delete keys with value: 0 or false
                delete routeValues[rk];
            }
        });

        historyService.push({
            pathname: historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });

        this._actions.selectItem.invoke(payload);
    }

    private _actions: SelectionActions;
}
