/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import "./PageTopHeader.scss";

export interface IPageTopHeader extends IVssComponentProperties {
    title: string;
    statusProps?: IStatusProps;
}

export class PageTopHeader extends BaseComponent<IPageTopHeader> {
    public render(): React.ReactNode {
        const statusProps = this.props.statusProps || {} as IStatusProps;
        return (
            <Header
                title={this.props.title || ""}
                titleSize={TitleSize.Large}
                titleClassName="k8s-top-header-title"
                titleIconProps={
                    this.props.statusProps ? {
                        render: (className?: string) => {
                            return (
                                <span className="flex-row">
                                    <Status {...statusProps} size={StatusSize.l} />
                                </span>
                            );
                        }
                    } : undefined
                }
            />
        );
    }
}
