/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { createBrowserHistory, History } from "history";
import * as queryString from "query-string";
import { SelectionActions, ISelectionPayload } from "./SelectionActions";

export class SelectionActionsCreator extends ActionCreatorBase {

    public static getKey(): string {
        return "selection-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._historyService = createBrowserHistory();
        this._actions = ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions);
    }

    public selectItem(payload: ISelectionPayload): void {
        let routeValues: queryString.OutputParams = queryString.parse(this._historyService.location.search);
        routeValues["type"] = payload.selectedItemType;
        routeValues["uid"] = payload.itemUID;

        if (!!payload.selectedItemType) {
            delete routeValues["view"];
        }

        // This logic needs some refining. We need to plan a course of action that will suit an open source hosting. The host might have its own query parameters
        // So, our design should be careful in handling those
        if (payload.properties) {
            // Add all the non-object, non-function and defined values to the url route. This will be read by the view loading itself
            Object.keys(payload.properties).forEach(k => {
                const value = payload.properties![k];
                if (!!value && typeof value !== "object" && typeof value !== "function") {
                    routeValues[k] = value;
                }

                // We will send undefined or empty for values that we want deleted from the url
                if (!value) {
                    delete routeValues[k];
                }
            });
        }

        this._historyService.push({
            pathname: this._historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });

        this._actions.selectItem.invoke(payload);
    }

    private _actions: SelectionActions;
    private _historyService: History;
}