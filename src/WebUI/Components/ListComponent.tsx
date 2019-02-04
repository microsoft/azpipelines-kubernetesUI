/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { TooltipHost, TooltipOverflowMode } from "azure-devops-ui/Tooltip";
import { VssDetailsList } from "azure-devops-ui/VssDetailsList";
import { ConstrainMode, SelectionMode, IDetailsHeaderProps, IDetailsRowProps, DetailsRow } from "office-ui-fabric-react/lib/DetailsList";
import { BaseComponent, css, IRenderFunction } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import "./ListComponent.scss";

export interface IListComponentProperties<T> extends IVssComponentProperties {
    headingText?: string;
    headingContent?: JSX.Element;
    items: T[];
    columns: IColumn[];
    onRenderItemColumn: (item?: T, index?: number, column?: IColumn) => React.ReactNode;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
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
            <VssDetailsList
                className={"kube-list"}
                items={this.props.items}
                columns={this.props.columns}
                onRenderRow={this._onRenderRow}
                onRenderItemColumn={this.props.onRenderItemColumn}
                isHeaderVisible={true}
                selectionMode={SelectionMode.single}
                constrainMode={ConstrainMode.unconstrained}
                onItemInvoked={this._onItemInvoked}
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

    public static renderTwoLineColumn(primaryText: string, subText: string, className?:string, primaryTextClassName?: string, secondaryTextClassName?:string ) : React.ReactNode {
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

    private _onItemInvoked = (item?: any, index?: number, ev?: Event) => {
        if (this.props.onItemInvoked) {
            this.props.onItemInvoked(item, index, ev);
        }
    }

    private _getComponentHeadingContent(): JSX.Element | null {
        if (!this.props.headingText && !this.props.headingContent) {
            return null;
        }

        return (
            <div className={"kube-list-heading heading"}>
                {this.props.headingText
                    ? <span className={"heading-title"}>{this.props.headingText}</span>
                    : this.props.headingContent}
            </div>
        );
    }
}
