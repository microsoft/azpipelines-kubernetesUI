/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { KubeImage } from "../../Contracts/Contracts";

export class DefaultImageLocation {
    public static getImageLocation = (image: KubeImage): string | undefined => {
        return DefaultImageLocation._imageLocations.get(image) || DefaultImageLocation._imageLocations.get(KubeImage.zeroData);
    }

    private static _imageLocations: Map<KubeImage, string> = new Map([
        [KubeImage.zeroData, require("../../img/zero-data.svg")],
        [KubeImage.zeroResults, require("../../img/zero-results.svg")],
        [KubeImage.zeroWorkloads, require("../../img/zero-workloads.svg")],
        [KubeImage.resourceDeleted, require("../../img/zero-data.svg")],
        [KubeImage.resourceAccessDenied, require("../../img/zero-data.svg")],
    ]);
}