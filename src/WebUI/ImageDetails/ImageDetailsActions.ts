/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { ActionsHubBase, Action } from "../FluxCommon/Actions";
import { IImageDetails } from "../../Contracts/Types";

export class ImageDetailsActions extends ActionsHubBase {
    public static getKey(): string {
        return "image-details-actions";
    }

    public initialize(): void {
        this._setImageDetails = new Action<IImageDetails | undefined>();
        this._setHasImageDetails = new Action<{ [key: string]: boolean } | undefined>();
    }

    public get setImageDetails(): Action<IImageDetails | undefined> {
        return this._setImageDetails;
    }

    public get setHasImageDetails(): Action<{ [key: string]: boolean } | undefined> {
        return this._setHasImageDetails;
    }

    private _setImageDetails: Action<IImageDetails | undefined>;
    private _setHasImageDetails: Action<{ [key: string]: boolean } | undefined>;
}
