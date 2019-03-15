/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

export interface IImageDetails {
    imageName: string;
    imageUri: string;
    hash: string;
    baseImageName: string;
    distance?: number;
    imageType: string;
    mediaType: string;
    tags: Array<string>;
    layerInfo: Array<IImageLayer>;
    buildId: number;
    buildVersion: string;
    buildDefinitionName: string;
    buildDefinitionId: string;
}

export interface IImageLayer {
    directive: string;
    arguments: string;
}