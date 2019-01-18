import * as React from "react";
import { BaseComponent } from "@uifabric/utilities/lib";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { IVssComponentProperties } from "../Types";

export interface IPodStatusProps extends IVssComponentProperties {
    statusProps: IStatusProps | undefined;
    statusSize?: StatusSize;
    statusDescription?: string;
    customDescription?: React.ReactNode;
}

export class PodStatusComponent extends BaseComponent<IPodStatusProps, {}> {

    public render(): React.ReactNode {
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