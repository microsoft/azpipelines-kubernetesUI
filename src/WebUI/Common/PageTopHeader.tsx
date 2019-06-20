/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { CustomHeader, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { IVssComponentProperties } from "../Types";

export interface IPageTopHeader extends IVssComponentProperties {
    title: string;
    statusProps?: IStatusProps;
    statusTooltip?: string;
}

export class PageTopHeader extends React.Component<IPageTopHeader> {
    public render(): React.ReactNode {
        const { title } = this.props;
        return (
            <CustomHeader className={this.props.className}>
                {this._getHeaderIcon()}
                <HeaderTitleArea>
                    <HeaderTitleRow>
                        <HeaderTitle titleSize={TitleSize.Large}>{title || ""}</HeaderTitle>
                    </HeaderTitleRow>
                </HeaderTitleArea>
            </CustomHeader>
        );
    }

    private _getHeaderIcon(): JSX.Element | undefined {
        const statusComponent = (sProps, cName) => <Status {...sProps} className={cName} size={StatusSize.l} />;
        let { statusTooltip, statusProps } = this.props;
        statusTooltip = statusTooltip || "";
        statusProps = statusProps ? { ...statusProps, ariaLabel: statusTooltip } : statusProps;

        return statusProps &&
            <HeaderIcon
                className="bolt-table-status-icon-large"
                iconProps={{
                    render: (className?: string) =>
                        <Tooltip text={statusTooltip} showOnFocus={true} overflowOnly={!statusTooltip}>
                            <div className="flex-row">{statusComponent(statusProps, className)}</div>
                        </Tooltip>
                }}
            />;
    }
}
