/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase, Action } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { IKubeService } from "../../Contracts/Contracts";
import { V1ServiceList } from "@kubernetes/client-node";
import { ServicesActions } from "./ServicesActions";

export class ServicesActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "workloads-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<ServicesActions>(ServicesActions);
    }

    public getServices(kubeService: IKubeService): void {
        kubeService.getServices().then(servicesList => {
            this._actions.servicesFetched.invoke(servicesList);
        });
    }

    private _actions: ServicesActions;
}

