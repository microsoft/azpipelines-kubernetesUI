/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import * as React from "react";
import { IVssComponentProperties } from "../Types";

export interface IResourceStatusProps extends IVssComponentProperties {
    statusProps: IStatusProps | undefined;
    statusSize?: StatusSize;
    statusDescription?: string;
    customDescription?: React.ReactNode;
    toolTipText?: string;
}

export class ResourceStatus extends React.Component<IResourceStatusProps, {}> {

    public render(): React.ReactNode {
        return (
            <div className={css("kube-status-container", this.props.className)}>
                {
                    this.props.toolTipText ?
                        <Tooltip text={this.props.toolTipText} overflowOnly={false} showOnFocus>
                            {this._getStatus()}
                        </Tooltip> : this._getStatus()
                }
            </div>
        );
    }

    private _getStatus(): JSX.Element {
        return (
            <span className="res-status">
                {this.props.statusProps &&
                    <Status {...this.props.statusProps} size={this.props.statusSize || StatusSize.m} />}
                <div className="description-padding">
                    {
                        this.props.statusDescription &&
                        <span className="kube-status-desc">{this.props.statusDescription}</span>
                    }
                    {
                        this.props.customDescription
                    }
                </div>
            </span>
        );
    }
}