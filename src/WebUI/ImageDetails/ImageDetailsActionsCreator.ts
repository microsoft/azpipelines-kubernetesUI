/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionCreatorBase, Action } from "../FluxCommon/Actions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { IImageService } from "../../Contracts/Contracts";
import { IImageDetails } from "../../Contracts/Types";
import { ImageDetailsActions } from "./ImageDetailsActions";
import { ImageDetailsStore } from "./ImageDetailsStore";
import { ImageDetailsEvents } from "../Constants";
import { KubeFactory } from "../KubeFactory";

export class ImageDetailsActionsCreator extends ActionCreatorBase {
    public static getKey(): string {
        return "image-details-actionscreator";
    }

    public initialize(instanceId?: string): void {
        this._actions = ActionsHubManager.GetActionsHub<ImageDetailsActions>(ImageDetailsActions);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
    }

    public setHasImageDetails(imageService: IImageService, listImages: string[]): void {
        imageService && imageService.hasImageDetails(listImages).then(hasImageDetails => {
            if (hasImageDetails && hasImageDetails.hasOwnProperty("hasImageDetails")) {
                this._actions.setHasImageDetails.invoke(hasImageDetails["hasImageDetails"] as { [key: string]: boolean });
            }
        });
    }

    public getImageDetails(imageId: string, showImageDetailsAction: (imageDetails: IImageDetails) => void) {
        let imageDetails: IImageDetails | undefined = this._imageDetailsStore.getImageDetails(imageId);
        if (imageDetails) {
            showImageDetailsAction(imageDetails);
        }
        else {
            const imageService = KubeFactory.getImageService();
            imageService && imageService.getImageDetails(imageId).then(fetchedImageDetails => {
                if (fetchedImageDetails) {
                    this._actions.setImageDetails.invoke(fetchedImageDetails);
                    showImageDetailsAction(fetchedImageDetails);
                }
            });
        }
    }

    private _actions: ImageDetailsActions;
    private _imageDetailsStore: ImageDetailsStore;
}

