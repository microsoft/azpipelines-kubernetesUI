/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities/lib";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { IVssComponentProperties } from "../Types";

export interface IPodStatusProps extends IVssComponentProperties {
    statusProps: IStatusProps | undefined;
    statusSize?: StatusSize;
    statusDescription?: string;
    customStatusDescription?: string;
    customTooltipText?: string;
}

export class PodStatusComponent extends BaseComponent<IPodStatusProps, {}> {

    public render(): React.ReactNode {
        // custom status is blank, then take the actual status, otherwise in tooltip scenario we will show wrong status text
        const statusText: string = this.props.customStatusDescription || this.props.statusDescription || "";
        const innerComponent = (
            <div className="kube-status-container">
                {
                    this.props.statusProps &&
                    <Status {...this.props.statusProps} size={this.props.statusSize || StatusSize.m} />
                }
                {
                    statusText &&
                    <span className="kube-status-desc">{statusText}</span>
                }
            </div>
        );

        if (this.props.customStatusDescription) {
            return (
                <Tooltip showOnFocus={true} text={this.props.customTooltipText || ""}>
                    {innerComponent}
                </Tooltip>
            );
        }
        else {
            return innerComponent;
        }

    }
}