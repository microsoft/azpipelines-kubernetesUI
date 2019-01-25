import * as React from "react";
import { BaseComponent } from "@uifabric/utilities/lib";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { IVssComponentProperties } from "../Types";
import { TooltipHost } from "azure-devops-ui/Tooltip";

export interface IResourceStatusProps extends IVssComponentProperties {
    statusProps: IStatusProps | undefined;
    statusSize?: StatusSize;
    statusDescription?: string;
    customDescription?: React.ReactNode;
    toolTipText?: string;
}

export class ResourceStatusComponent extends BaseComponent<IResourceStatusProps, {}> {

    public render(): React.ReactNode {
        return (
            <div className="kube-status-container">
                {
                    this.props.toolTipText ?
                        <TooltipHost content={this.props.toolTipText} >
                            {this._getStatus()}
                        </TooltipHost> : this._getStatus()
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

    private _getStatus(): React.ReactNode {
        return this.props.statusProps &&
            <Status {...this.props.statusProps} size={this.props.statusSize || StatusSize.m} />;
    }
}