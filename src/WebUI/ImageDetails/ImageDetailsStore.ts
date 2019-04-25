/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { StoreBase } from "../FluxCommon/Store";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { IImageDetails } from "../../Contracts/Types";
import { ImageDetailsActions } from "./ImageDetailsActions";
import { ImageDetailsEvents } from "../Constants";

export class ImageDetailsStore extends StoreBase {
    public static getKey(): string {
        return "image-details-store";
    }

    public initialize(instanceId?: string): void {
        super.initialize(instanceId);

        this._actions = ActionsHubManager.GetActionsHub<ImageDetailsActions>(ImageDetailsActions);
        this._actions.setHasImageDetails.addListener(this._setHasImageDetailsData);
    }

    public disposeInternal(): void {
        this._actions.setHasImageDetails.removeListener(this._setHasImageDetailsData);
    }

    public hasImageDetails(imageName: string): boolean | undefined {
        if (this._hasImageDetails && this._hasImageDetails.hasOwnProperty(imageName)) {
            return this._hasImageDetails[imageName];
        }

        return undefined;
    }

    private _setHasImageDetailsData = (payload: { [key: string]: boolean } | undefined): void => {
        if (payload) {
            this._hasImageDetails = payload;
            this.emit(ImageDetailsEvents.HasImageDetailsEvent, this);
        }
    }

    private _hasImageDetails: { [key: string]: boolean } = {};
    private _imageDetails: { [key: string]: IImageDetails } = {};
    private _actions: ImageDetailsActions;
}

