/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/


import { CustomHeader, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export interface IPageTopHeader extends IVssComponentProperties {
    title: string;
    statusProps?: IStatusProps;
    statusTooltip?: string;
}

export class PageTopHeader extends React.Component<IPageTopHeader> {
    public render(): React.ReactNode {
        const { title, statusProps } = this.props;
        return (
            <CustomHeader>
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
        const statusComponent = (statusProps, className) => <Status {...statusProps} className={className} size={StatusSize.l} />;

        return this.props.statusProps &&
            <HeaderIcon
                className="bolt-table-status-icon-large"
                iconProps={{
                    render: (className?: string) =>
                        <Tooltip text={this.props.statusTooltip || ""} showOnFocus={true} overflowOnly={!this.props.statusTooltip}>
                            <div className="flex-row">{statusComponent(this.props.statusProps, className)}</div>
                        </Tooltip>
                }}
            />;
    }
}
