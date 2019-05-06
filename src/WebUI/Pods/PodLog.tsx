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
                className="k8s-pod-log"
                contentClassName="k8s-pod-log-content"
                options={{
                    theme: "vs-dark",
                    language: "text/plain",
                    wordWrap: "on",
                    wrappingIndent: "same"
                }}
                text={this.state.logContent || ""}
            />
        );
    }

    public componentDidMount(): void {
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
}