/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { IStatusProps, Status, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, SimpleTableCell, Table, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import "./BaseKubeTable.scss";
import { IResourceStatusProps, ResourceStatus } from "./ResourceStatus";

export interface ITableComponentProperties<T> extends IVssComponentProperties {
    className?: string;
    headingText?: string | JSX.Element;
    headingDescription?: string;
    hideHeaders?: boolean;
    hideLines?: boolean;
    items: T[];
    columns: ITableColumn<T>[];
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: any) => void;
    onItemSelected?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: any) => void;
}

export class BaseKubeTable<T> extends BaseComponent<ITableComponentProperties<T>> {
    public render(): React.ReactNode {
        return (
            <CustomCard className={css("flex-grow", "bolt-card-no-vertical-padding", this.props.className || "")}>
                {
                    this.props.headingText &&
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                {
                                    (typeof this.props.headingText === "string") ?
                                        <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                            {this.props.headingText}
                                        </HeaderTitle> :
                                        <HeaderTitle
                                            className="text-ellipsis"
                                            titleSize={TitleSize.Medium}
                                            children={this.props.headingText}
                                        />
                                }
                            </HeaderTitleRow>
                            {
                                this.props.headingDescription &&
                                <HeaderDescription className="text-ellipsis">{this.props.headingDescription}</HeaderDescription>
                            }
                        </HeaderTitleArea>
                    </CustomHeader>
                }
                <CardContent contentPadding={false}>
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
                singleClickActivation={!!this.props.onItemActivated}
                onActivate={this._onItemActivated}
                onSelect={this._onItemSelected}
            />
        );
    }

    public static renderColumn(
        text: string,
        renderer: (text: string, contentClassName?: string) => React.ReactNode,
        contentClassName?: string): React.ReactNode {
        return text && renderer ? renderer(text, contentClassName) : null;
    }

    public static defaultColumnRenderer(text: string, contentClassName?: string, tooltipText?: string): React.ReactNode {
        return (
            <Tooltip text={tooltipText || text} overflowOnly={!tooltipText}>
                <span className={css("text-ellipsis", contentClassName || "")}>{text}</span>
            </Tooltip>
        );
    }

    public static renderTableCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, itemToRender: React.ReactNode, statusProps?: IResourceStatusProps, contentClassName?: string): JSX.Element {
        return (
            <SimpleTableCell contentClassName={contentClassName || ""} columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {statusProps && <ResourceStatus {...statusProps} />}
                {itemToRender}
            </SimpleTableCell>
        );
    }

    public static renderTwoLineColumn(columnIndex: number, tableColumn: ITableColumn<any>, primaryText: string, subText: string, className?: string, primaryTextClassName?: string, secondaryTextClassName?: string, statusProps?: IResourceStatusProps): JSX.Element {
        return (
            <TwoLineTableCell
                className={className}
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                line1={
                    <div className={css("kube-list-col-data", primaryTextClassName)} key={"col-primary-" + columnIndex}>
                        <Tooltip text={primaryText} overflowOnly>
                            <span className="text-ellipsis">{primaryText}</span>
                        </Tooltip>
                    </div>
                }
                line2={
                    <div className={css("list-secondary-text", secondaryTextClassName)} key={"col-secondary-" + columnIndex}>
                        <Tooltip text={subText} overflowOnly>
                            <span className="text-ellipsis">{subText}</span>
                        </Tooltip>
                    </div>
                }
                iconProps={statusProps ? { render: (key: string | undefined) => <ResourceStatus {...statusProps} /> } : {}}
                key={"col-" + columnIndex}
            />
        );
    }

    public static renderPodsStatusTableCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, podsCountString?: string, podsStatusProps?: IStatusProps): JSX.Element {
        const itemToRender = podsCountString ? (
            <Tooltip text={podsCountString} overflowOnly>
                <Link
                    className="fontSizeM flex-center flex-row text-ellipsis bolt-table-link bolt-table-inline-link"
                    excludeTabStop
                    href="#"
                >
                    {podsStatusProps && <Status {...podsStatusProps} size={StatusSize.m} />}
                    <div className="k8s-pods-status-count">{podsCountString}</div>
                </Link>
            </Tooltip>
        ) : null;

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
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
