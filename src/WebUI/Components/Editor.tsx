import { BaseComponent } from "@uifabric/utilities";
import { IVssComponentProperties } from "../Types";
import * as React from "react";
// basic editor functionality
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// additional functionality of editor
import "monaco-editor/esm/vs/editor/browser/controller/coreCommands";
import "monaco-editor/esm/vs/editor/contrib/find/findController";
// languages supported in editor
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution";


export interface IEditorProps extends IVssComponentProperties {
    options?: monaco.editor.IEditorConstructionOptions;
}

export class Editor extends BaseComponent<IEditorProps> {
    constructor(props: IEditorProps) {
        super(props, {});
    }

    public render(): React.ReactNode {
        return (
            <div className="editor-outer" style={{ width: "100%", minHeight: "100px", margin: "10px 0px" }}>
                <div className="editor-inner" style={{ minHeight: "100px" }} id="k8s-monaco-editor" ref={(innerRef) => {
                    if (innerRef && !this._editor) {
                        this._editor = monaco.editor.create(innerRef, {
                            value: "",
                            language: "yaml",
                            readOnly: true,
                            renderWhitespace: "all",
                            theme: "vs-dark",
                            scrollbar: { horizontalScrollbarSize: 16 },
                            lineNumbers: "on",
                            extraEditorClassName: "k8s-monaco-editor",
                            ...this.props.options
                        });
                    }
                }}>
                </div>
            </div>
        );
    }

    private _editor: monaco.editor.IStandaloneCodeEditor | null = null;
}