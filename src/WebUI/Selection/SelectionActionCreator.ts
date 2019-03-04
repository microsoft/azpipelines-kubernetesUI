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
        this._historyService.push({
            pathname: this._historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });
        
        this._actions.selectItem.invoke(payload);
    }

    private _actions: SelectionActions;
    private _historyService: History;
}