/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import * as Util_String from "azure-devops-ui/Core/Util/String";
import * as React from "react";
import { KubeSummary } from "../Common/KubeSummary";
import * as Resources from "../Resources";
import { PodContentReader } from "./PodContentReader";
import { IPodRightPanelProps } from "./PodsRightPanel";

export interface IPodLogProps extends IPodRightPanelProps {
    // Overriding this to make sure we don't accept undefined
    pod: V1Pod;
}

interface IPodLogState {
    logContent: string;
    uid: string;
}

export class PodLog extends React.Component<IPodLogProps, IPodLogState> {
    constructor(props: IPodLogProps) {
        super(props, {});
        this.state = { logContent: Resources.LoadingText, uid: this.props.pod.metadata.uid };
    }

    public render(): JSX.Element {
        return (
            <PodContentReader
                key={this.state.uid}
                className="pod-log"
                contentClassName="pod-log-content"
                options={{
                    theme: "vs-dark",
                    language: "text/plain"
                }}
                text={this.state.logContent || ""}
            />
        );
    }

    public componentWillUnmount(): void {
        if (this._heightCssElement && document && document.head) {
            document.head.removeChild(this._heightCssElement);
            this._heightCssElement = undefined;
        }
    }

    public componentDidMount(): void {
        if (!this._heightCssElement) {
            this._heightCssElement = document.createElement("style");
            this._heightCssElement.type = "text/css";
            if (document && document.head) {
                document.head.appendChild(this._heightCssElement);
            }
        }

        this._heightCssElement.innerText = ".kubernetes-container .pod-overview-full-size { height: unset; min-height: 100%; }";

        const service = KubeSummary.getKubeService();
        const podName = this.props.pod.metadata.name;
        const spec = this.props.pod.spec || undefined;
        const podContainerName = spec && spec.containers && spec.containers.length > 0 && spec.containers[0].name || "";

        service && service.getPodLog && service.getPodLog(podName, podContainerName).then(logContent => {
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: logContent || ""
            });
        }).catch(error => {
            let errorMessage = error || "";
            errorMessage = (typeof errorMessage == "string") ? errorMessage : JSON.stringify(errorMessage);
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: errorMessage
            });
        });
    }

    private _heightCssElement: HTMLStyleElement | undefined;
}