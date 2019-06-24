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
        this._setHasImageDetails = new Action<{ [key: string]: boolean } | undefined>();
        this._setImageDetails = new Action<IImageDetails>();
    }

    public get setHasImageDetails(): Action<{ [key: string]: boolean } | undefined> {
        return this._setHasImageDetails;
    }

    public get setImageDetails(): Action<IImageDetails> {
        return this._setImageDetails;
    }

    private _setHasImageDetails: Action<{ [key: string]: boolean } | undefined>;
    private _setImageDetails: Action<IImageDetails>;
}
