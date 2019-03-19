/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { CustomHeader, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import { IVssComponentProperties } from "../Types";

export interface IPageTopHeader extends IVssComponentProperties {
    title: string;
    statusProps?: IStatusProps;
}

export class PageTopHeader extends BaseComponent<IPageTopHeader> {
    public render(): React.ReactNode {
        const { title, statusProps } = this.props;
        return (
            <CustomHeader>
                {PageTopHeader._getHeaderIcon(statusProps)}
                <HeaderTitleArea>
                    <HeaderTitleRow>
                        <HeaderTitle titleSize={TitleSize.Large}>{title || ""}</HeaderTitle>
                    </HeaderTitleRow>
                </HeaderTitleArea>
            </CustomHeader>
        );
    }

    private static _getHeaderIcon(statusProps?: IStatusProps): JSX.Element | undefined {
        const statusComponent = (statusProps, className) => <Status {...statusProps} className={className} size={StatusSize.l} />;

        return statusProps &&
            <HeaderIcon
                className="bolt-table-status-icon-large"
                iconProps={{
                    render: (className?: string) => <div className="flex-row">{statusComponent(statusProps, className)}</div>
                }}
            />;
    }
}
