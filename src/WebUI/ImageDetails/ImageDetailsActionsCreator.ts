/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase, Action } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { IImageService } from "../../Contracts/Contracts";
import { IImageDetails } from "../../Contracts/Types";
import { ImageDetailsActions } from "./ImageDetailsActions";
import { ImageDetailsEvents } from "../Constants";

export class ImageDetailsActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "image-details-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<ImageDetailsActions>(ImageDetailsActions);
    }

    public setHasImageDetails(imageService: IImageService, listImages: string[]): void {
        imageService && imageService.hasImageDetails(listImages).then(hasImageDetails => {
            this._actions.setHasImageDetails.invoke(hasImageDetails);
        });
    }

    private _actions: ImageDetailsActions;
}

