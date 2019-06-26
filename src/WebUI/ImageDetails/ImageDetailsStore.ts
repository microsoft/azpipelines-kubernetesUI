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
        this._actions.setImageDetails.addListener(this._setImageDetailsData);
    }

    public disposeInternal(): void {
        this._actions.setHasImageDetails.removeListener(this._setHasImageDetailsData);
        this._actions.setImageDetails.removeListener(this._setImageDetailsData);
    }

    public hasImageDetails(imageName: string): boolean | undefined {
        return this._hasImageDetails[imageName];
    }

    public getImageDetails(imageName: string): IImageDetails | undefined {
        return this._imageDetails[imageName];
    }

    private _setHasImageDetailsData = (payload: { [key: string]: boolean } | undefined): void => {
        if (payload) {
            this._hasImageDetails = payload;
            this.emit(ImageDetailsEvents.HasImageDetailsEvent, this);
        }
    }

    private _setImageDetailsData = (payload: IImageDetails): void => {
        if (payload && payload.imageName) {
            this._imageDetails[payload.imageName] = payload;
            this.emit(ImageDetailsEvents.SetImageDetailsEvent, this);
        }
    }

    private _hasImageDetails: { [key: string]: boolean } = {};
    private _imageDetails: { [key: string]: IImageDetails } = {};
    private _actions: ImageDetailsActions;
}

