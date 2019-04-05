/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import * as React from "react";
import { getContentReaderComponent } from "../Common/KubeConsumer";
import { IVssComponentProperties } from "../Types";

export interface IPodReaderProps extends IVssComponentProperties {
    text: string;
    options?: any; /* monaco.editor.IEditorConstructionOptions */
    contentClassName?: string;
}

export class PodContentReader extends BaseComponent<IPodReaderProps> {
    public render(): JSX.Element {
        return (
            // monaco-editor class added here to have the same theme as monaco.
            <CustomCard className={css(this.props.className || "", "monaco-editor", "k8s-card-padding", "flex-grow")}>
                <CardContent className={css(this.props.contentClassName || "", "reader-content")} contentPadding={false}>
                    <div className="reader-outer" style={{ width: "100%", height: "500px", position: "relative" }}>
                        {getContentReaderComponent({ ...this.props })}
                    </div>
                </CardContent>
            </CustomCard>
        );
    }
}