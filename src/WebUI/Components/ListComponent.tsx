/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { TooltipHost, TooltipOverflowMode } from "azure-devops-ui/Tooltip";
import { BaseComponent, css, IRenderFunction } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import { Table, ITableColumn } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import "./ListComponent.scss";

export interface IListComponentProperties<T> extends IVssComponentProperties {
    headingText?: string;
    headingContent?: JSX.Element;
    items: T[];
    columns: ITableColumn<T>[];
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => void;
}

export class ListComponent<T> extends BaseComponent<IListComponentProperties<T>> {
    public render(): React.ReactNode {
        return (
            <div className={css("kube-list-content", this.props.className)}>
                {this._getComponentHeadingContent()}
                {this._getComponent()}
            </div>
        );
    }

    private _getComponent(): JSX.Element {
        return (
            <Table
                className={"kube-list"}
                itemProvider={new ArrayItemProvider<T>(this.props.items)}
                columns={this.props.columns}
                showHeader={true}
                showLines={false}
                singleClickActivation={false}
                onActivate={this._onItemActivated}
            />
        );
    }

    private _onRenderRow = (detailsRowProps: any, defaultRender?: any): JSX.Element => {
        return (<div className={"kube-list-row"}>
                    <DetailsRow {...detailsRowProps} />
                </div>);
    }

    public static renderColumn(
        text: string,
        renderer: (text: string, className?: string) => React.ReactNode, className?: string): React.ReactNode {
        return text && renderer ? renderer(text, className) : null;
    }

    public static defaultColumnRenderer(text: string, className?: string): React.ReactNode {
        return (
            <div className={css("kube-list-col-data overflow-ellipsis", className)}>
                <TooltipHost content={text} overflowMode={TooltipOverflowMode.Parent}>
                    {text}
                </TooltipHost>
            </div>
        );
    }

    public static renderTwoLineColumn(primaryText: string, subText: string, className?: string, primaryTextClassName?: string, secondaryTextClassName?: string): React.ReactNode {
        return (
            <div className={css("kube-list-col-data overflow-ellipsis", className)}>
                <div className={css("kube-list-col-data overflow-ellipsis", primaryTextClassName)}>
                    <TooltipHost content={primaryText} overflowMode={TooltipOverflowMode.Parent}>
                        {primaryText}
                    </TooltipHost>
                </div>
                <div className={css("list-secondary-text overflow-ellipsis", secondaryTextClassName)}>
                    <TooltipHost content={subText} overflowMode={TooltipOverflowMode.Parent}>
                        {subText}
                    </TooltipHost>
                </div>
            </div>
        );
    }

    private _onItemActivated = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, tableRow);
        }
    }

    private _getComponentHeadingContent(): JSX.Element | null {
        if (!this.props.headingText && !this.props.headingContent) {
            return null;
        }

        return (
            <div className={"kube-list-heading heading"}>
                {this.props.headingText
                    ? <h3 className={"heading-title"}>{this.props.headingText}</h3>
                    : this.props.headingContent}
            </div>
        );
    }
}
