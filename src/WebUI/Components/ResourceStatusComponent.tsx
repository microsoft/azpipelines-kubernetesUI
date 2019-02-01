import * as React from "react";
import { BaseComponent } from "@uifabric/utilities/lib";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { IVssComponentProperties } from "../Types";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export interface IResourceStatusProps extends IVssComponentProperties {
    statusProps: IStatusProps | undefined;
    statusSize?: StatusSize;
    statusDescription?: string;
    customDescription?: React.ReactNode;
    toolTipText?: string;
}

export class ResourceStatusComponent extends BaseComponent<IResourceStatusProps, {}> {

    public render(): React.ReactNode {
        if (this.props.toolTipText) {
            return (
                <div className="kube-status-container">
                    {this._getStatusWithToolTip()}
                </div>
            );
        }
        return this._getStatus();
    }

    private _getStatusWithToolTip(): React.ReactNode {
        return (
            <Tooltip text={this.props.toolTipText} overflowOnly={false} showOnFocus={true}>
                {this._getStatus()}
            </Tooltip>
        );
    }

    private _getStatus(): React.ReactNode {
        return (
            <div className="kube-status-container">
                {
                    this.props.statusProps &&
                    <Status {...this.props.statusProps} size={this.props.statusSize || StatusSize.m} />
                }
                {
                    this.props.statusDescription &&
                    <span className="kube-status-desc">{this.props.statusDescription}</span>
                }
                {
                    this.props.customDescription
                }
            </div>
        );
    }
}