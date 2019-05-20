/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import * as JsYaml from "js-yaml";
import * as React from "react";
import { PodContentReader } from "./PodContentReader";
import { IPodRightPanelProps } from "./Types";

export interface IPodYamlProps extends IPodRightPanelProps {
    // Overriding this to make sure we don't accept undefined
    pod: V1Pod;
}

export class PodYaml extends React.Component<IPodYamlProps> {
    public render(): JSX.Element {
        return (
            <PodContentReader
                className="pod-yaml"
                contentClassName="pod-yaml-content"
                text={JsYaml.safeDump(this.props.pod)}
                markTTICallback={this.props.markTTICallback}
            />
        );
    }
}