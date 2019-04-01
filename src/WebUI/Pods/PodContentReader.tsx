/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import * as React from "react";
import { IVssComponentProperties } from "../Types";

// basic editor functionality
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// languages supported in editor
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution";
// additional functionality of editor
import "monaco-editor/esm/vs/editor/browser/controller/coreCommands";
import "monaco-editor/esm/vs/editor/contrib/find/findController";
import "monaco-editor/esm/vs/editor/contrib/message/messageController";

export interface IReaderProps extends IVssComponentProperties {
    text: string;
    options?: monaco.editor.IEditorConstructionOptions;
    contentClassName?: string;
}

export class PodContentReader extends BaseComponent<IReaderProps> {
    public render(): JSX.Element {
        return (
            <CustomCard className={css(this.props.className || "", "k8s-card-padding", "flex-grow")}>
                <CardContent className={css(this.props.contentClassName || "", "reader-content")} contentPadding={false}>
                    <div className="reader-outer" style={{ width: "100%", height: "500px", position: "relative" }}>
                        <div
                            id="k8s-monaco-reader"
                            className="reader-inner flex-row flex-center absolute-fill"
                            ref={this._createEditor}
                        />
                    </div>
                </CardContent>
            </CustomCard>
        );
    }

    public componentDidMount(): void {
        window.addEventListener("resize", this._onResizeHandler);
    }

    public componentWillUnmount(): void {
        window.removeEventListener("resize", this._onResizeHandler);
        this._disposeEditor();
    }

    private _onResizeHandler = () => {
        if (this._editor) {
            this._editor.layout();
        }
    }

    private _createEditor = (innerRef) => {
        if (innerRef) {
            const text = this.props.text || "";
            this._disposeEditor();

            this._editor = monaco.editor.create(innerRef, {
                language: "yaml",
                readOnly: true,
                renderWhitespace: "all",
                theme: "vs",
                scrollbar: { horizontalScrollbarSize: 16 },
                lineNumbers: "on",
                extraEditorClassName: "k8s-monaco-editor",
                ...this.props.options,
                value: text
            });
        }
    }

    private _disposeEditor(): void {
        if (this._editor) {
            this._editor.dispose();
            this._editor = undefined;
        }
    }

    private _editor: monaco.editor.IStandaloneCodeEditor | undefined;
}