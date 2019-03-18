/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase, Action } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { IKubeService } from "../../Contracts/Contracts";
import { PodsActions } from "./PodsActions";

export class PodsActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "pods-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<PodsActions>(PodsActions);
    }

    public getPods(kubeService: IKubeService, labelSelector?: string): void {
        if (labelSelector) {
            kubeService && kubeService.getPods(labelSelector).then(podsList => {
                this._actions.podsFetchedByLabel.invoke(podsList);
            });
        }
        else {
            kubeService && kubeService.getPods().then(podsList => {
                this._actions.podsFetched.invoke(podsList);
            });
        }
    }

    private _actions: PodsActions;
}

