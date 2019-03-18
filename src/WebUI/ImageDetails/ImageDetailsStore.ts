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

    public getHasImageDetailsList(): { [key: string]: boolean } {
        return this._hasImageDetails;
    }

    public hasImageDetails(imageName: string): boolean {
        if (this._hasImageDetails && this._hasImageDetails.hasOwnProperty(imageName)) {
            return this._hasImageDetails.hasOwnProperty(imageName);
        }

        return false;
    }

    public getImageDetails(imageId: string): IImageDetails | undefined {
        if (this._imageDetails && this._imageDetails.hasOwnProperty(imageId)) {
            return this._imageDetails[imageId];
        }

        return undefined;
    }

    private _setHasImageDetailsData = (payload: { [key: string]: boolean } | undefined): void => {
        if (payload && Object.keys(this._hasImageDetails).length === 0) {
            this._hasImageDetails = payload;
            this.emit(ImageDetailsEvents.HasImageDetailsEvent, this);
        }
    }

    private _setImageDetailsData = (payload: IImageDetails | undefined): void => {
        if (payload && !this._imageDetails.hasOwnProperty(payload.imageName)) {
            this._imageDetails[payload.imageName] = payload;
            this.emit(ImageDetailsEvents.GetImageDetailsEvent, this);
        }
    }

    private _hasImageDetails: { [key: string]: boolean } = {};
    private _imageDetails: { [key: string]: IImageDetails } = {};
    private _actions: ImageDetailsActions;
}

