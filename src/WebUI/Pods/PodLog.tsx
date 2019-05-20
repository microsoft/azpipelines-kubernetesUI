/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import * as Util_String from "azure-devops-ui/Core/Util/String";
import * as React from "react";
import * as Resources from "../../Resources";
import { Scenarios } from "../Constants";
import { KubeFactory } from "../KubeFactory";
import { PodContentReader } from "./PodContentReader";
import { IPodRightPanelProps } from "./Types";

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
        const service = KubeFactory.getKubeService();
        const podName = this.props.pod.metadata.name;
        const spec = this.props.pod.spec || undefined;
        const podContainerName = spec && spec.containers && spec.containers.length > 0 && spec.containers[0].name || "";

        const scenarioPayload = {
            "scenario": Scenarios.PodLogs
        };
        service && service.getPodLog && service.getPodLog(podName, podContainerName).then(logContent => {
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: logContent || ""
            });
            this.props.markTTICallback && this.props.markTTICallback(scenarioPayload);
        }).catch(error => {
            let errorMessage = error || "";
            errorMessage = (typeof errorMessage == "string") ? errorMessage : JSON.stringify(errorMessage);
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: errorMessage
            });
            this.props.markTTICallback && this.props.markTTICallback(scenarioPayload);
        });
    }
}