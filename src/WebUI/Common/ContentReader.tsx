/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { CardContent } from "azure-devops-ui/Components/Card/CardContent";
import { CustomCard } from "azure-devops-ui/Components/Card/CustomCard";
import { css } from "azure-devops-ui/Util";
import * as React from "react";

import "./ContentReader.scss";

// basic editor functionality
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// languages supported in editor
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution";
// additional functionality of editor
import "monaco-editor/esm/vs/editor/browser/controller/coreCommands";
import "monaco-editor/esm/vs/editor/contrib/find/findController";
import "monaco-editor/esm/vs/editor/contrib/message/messageController";

export interface IReaderProps {
    text: string;
    options?: monaco.editor.IEditorConstructionOptions;
    contentClassName?: string;
    className?: string;
}

export class ContentReader extends React.Component<IReaderProps> {
    public render(): JSX.Element {
        return (
            // monaco-editor class added here to have the same theme as monaco.
            <CustomCard className={css(this.props.className || "", "monaco-editor", "k8s-card-padding", "flex-grow")}>
                <CardContent className={css(this.props.contentClassName || "", "k8s-reader-content")} contentPadding={false}>
                    <div className="k8s-reader-outer" style={{ width: "100%", position: "relative" }}>
                        <div
                            id="k8s-monaco-reader-default"
                            className="k8s-monaco-reader-default reader-inner flex-row flex-center absolute-fill"
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
                readOnly: true,
                renderWhitespace: "all",
                fontSize: 13,
                lineHeight: 20,
                minimap: { enabled: false },
                scrollbar: { horizontalScrollbarSize: 16 },
                lineNumbers: "on",
                extraEditorClassName: "k8s-monaco-editor",
                theme: "vs",
                language: "yaml",
                ...this.props.options,
                value: text
            });
        }
    }

    private _disposeEditor(): void {
        if (this._editor) {
            try {
                this._editor.dispose();
            }
            catch (e) { }

            this._editor = undefined;
        }
    }

    private _editor: monaco.editor.IStandaloneCodeEditor | undefined;
}