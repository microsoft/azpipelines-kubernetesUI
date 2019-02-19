/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { TooltipHost, TooltipOverflowMode } from "azure-devops-ui/Tooltip";
import { BaseComponent, css, IRenderFunction } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import { Table, ITableColumn, TableRow, ITableRowProps, SimpleTableCell, TwoLineTableCell } from "azure-devops-ui/Table";
import { ITableRow, ITableRowDetails } from "azure-devops-ui/Components/Table/Table.Props";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { CustomCard, CardContent } from "azure-devops-ui/Card";
import {
    HeaderDescription,
    CustomHeader,
    HeaderTitle,
    HeaderTitleArea,
    HeaderTitleRow,
    TitleSize
} from "azure-devops-ui/Header";
import "./BaseKubeTable.scss";
import { IResourceStatusProps, ResourceStatus } from "./ResourceStatus";

export interface ITableComponentProperties<T> extends IVssComponentProperties {
    className?: string
    headingText?: string | JSX.Element;
    headingDescription?: string;
    hideHeaders?: boolean;
    hideLines?:boolean;
    items: T[];
    columns: ITableColumn<T>[];
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: any) => void;
    onItemSelected?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: any) => void;
}

export class BaseKubeTable<T> extends BaseComponent<ITableComponentProperties<T>> {
    public render(): React.ReactNode {
        return (
            <CustomCard className={css("flex-grow", "bolt-card-no-vertical-padding", "item-top-padding", "kube-list-content", this.props.className || "")}>
                {
                    this.props.headingText &&
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow className="kube-flex-row">
                                {
                                    (typeof this.props.headingText === 'string') ?
                                        <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                            {this.props.headingText}
                                        </HeaderTitle> :
                                        <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} children={this.props.headingText} />
                                }
                            </HeaderTitleRow>
                            {
                                this.props.headingDescription &&
                                <HeaderDescription className={css("text-ellipsis", "secondary-text")}>
                                    {this.props.headingDescription}
                                </HeaderDescription>
                            }
                        </HeaderTitleArea>
                    </CustomHeader>
                }
                <CardContent className="item-no-padding">
                    {this.props.items && this.props.items.length > 0 && this._getComponent()}
                </CardContent>
            </CustomCard>
        );
    }

    private _getComponent(): JSX.Element {
        return (
            <Table
                className={"kube-list"}
                itemProvider={new ArrayItemProvider<T>(this.props.items)}
                columns={this.props.columns}
                showHeader={!this.props.hideHeaders}
                showLines={!this.props.hideLines}
                singleClickActivation={false}
                onActivate={this._onItemActivated}
                onSelect={this._onItemSelected}
            />
        );
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

    public static renderTableCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, itemToRender: React.ReactNode, statusProps?:IResourceStatusProps): JSX.Element {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {statusProps && <ResourceStatus {...statusProps} />}
                {itemToRender}
            </SimpleTableCell>);
    }

    public static renderTwoLineColumn(columnIndex: number, tableColumn: ITableColumn<any>, primaryText: string, subText: string, className?: string, primaryTextClassName?: string, secondaryTextClassName?: string, statusProps?: IResourceStatusProps): JSX.Element {
        return (
            <TwoLineTableCell className={className} columnIndex={columnIndex} tableColumn={tableColumn} line1={
                <div className={css("kube-list-col-data overflow-ellipsis", primaryTextClassName)} key={"col-primary-" + columnIndex}>
                    <TooltipHost content={primaryText} overflowMode={TooltipOverflowMode.Parent}>
                        {primaryText}
                    </TooltipHost>
                </div>
            } line2={
                <div className={css("list-secondary-text overflow-ellipsis", secondaryTextClassName)} key={"col-secondary-" + columnIndex}>
                    <TooltipHost content={subText} overflowMode={TooltipOverflowMode.Parent}>
                        {subText}
                    </TooltipHost>
                </div>
                }
                iconProps={statusProps ? {render: (key:string | undefined) => <ResourceStatus {...statusProps} />} :{}}
                key={"col-" + columnIndex} />
        );
    }

    private _onItemActivated = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, tableRow, this.props.items[tableRow.index]);
        }
    }

    private _onItemSelected = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.props.onItemSelected) {
            this.props.onItemSelected(event, tableRow, this.props.items[tableRow.index]);
        }
    }
}
