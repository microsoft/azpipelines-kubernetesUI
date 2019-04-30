/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/


import * as React from "react";
import { getContentReaderComponent } from "../Common/KubeConsumer";
import { IVssComponentProperties } from "../Types";

export interface IPodReaderProps extends IVssComponentProperties {
    text: string;
    options?: any; /* monaco.editor.IEditorConstructionOptions */
    contentClassName?: string;
}

export class PodContentReader extends React.Component<IPodReaderProps> {
    public render(): React.ReactNode {
        return getContentReaderComponent({ ...this.props });
    }
}