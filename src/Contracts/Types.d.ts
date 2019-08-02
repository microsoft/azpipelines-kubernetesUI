/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

export interface IImageDetails {
    imageName: string;
    imageUri: string;
    baseImageName: string;
    distance?: number;
    imageType: string;
    mediaType: string;
    tags: Array<string>;
    layerInfo: Array<IImageLayer>;
    runId: number;
    pipelineVersion: string;
    pipelineName: string;
    pipelineId: string;
    jobName: string;
    imageSize: string;
    createTime?: Date;
}

export interface IImageLayer {
    directive: string;
    arguments: string;
    size: string;
    createdOn: Date;
}