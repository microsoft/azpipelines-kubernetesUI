/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1Pod, V1ReplicaSet, V1StatefulSet } from "@kubernetes/client-node";

import { css } from "azure-devops-ui/Util";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow, TableColumnStyle } from "azure-devops-ui/Components/Table/Table.Props";
import { format } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, SimpleTableCell, Table, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { Button } from "azure-devops-ui/Button";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { SelectedItemKeys } from "../Constants";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { IPodDetailsSelectionProperties, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./KubeCardWithTable.scss";
import { IResourceStatusProps, ResourceStatus } from "./ResourceStatus";
import * as Resources from "../Resources";

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

export class KubeCardWithTable<T> extends React.Component<ITableComponentProperties<T>> {
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

export function defaultColumnRenderer(text: string, contentClassName?: string, tooltipText?: string): React.ReactNode {
    return (
        // show tooltip if specified, otherwise show only when element overflows
        <Tooltip text={tooltipText || text} overflowOnly={!tooltipText}>
            <span className={css("text-ellipsis", contentClassName || "")}>{text}</span>
        </Tooltip>
    );
}

export function renderTableCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<any>,
    itemToRender: React.ReactNode,
    statusProps?: IResourceStatusProps,
    contentClassName?: string
): JSX.Element {
    const { columnStyle } = tableColumn;
    return (
        <SimpleTableCell
            className={css(
                columnStyle === TableColumnStyle.Primary && "bolt-table-cell-primary",
                columnStyle === TableColumnStyle.Secondary && "bolt-table-cell-secondary",
                columnStyle === TableColumnStyle.Tertiary && "bolt-table-cell-tertiary"
            )}
            contentClassName={contentClassName || ""}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            key={columnIndex}
        >
            {statusProps && <ResourceStatus {...statusProps} />}
            {itemToRender}
        </SimpleTableCell>
    );
}

export function renderTwoLineColumn(
    columnIndex: number,
    tableColumn: ITableColumn<any>,
    primaryText: string,
    subText: string,
    className?: string,
    primaryTextClassName?: string,
    secondaryTextClassName?: string,
    statusProps?: IResourceStatusProps
): JSX.Element {
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

export function renderPodNameWithStatusTableCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<any>,
    podName?: string,
    podStatusProps?: IStatusProps,
    statusTooltip?: string,
    contentClassName?: string
): JSX.Element {
    return podName ? (
        <TwoLineTableCell
            key={format("row-{0}-col-{1}", rowIndex, columnIndex)}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            line1={
                <Tooltip overflowOnly={true} text={podName}>
                    <div className={css("text-ellipsis", contentClassName)}>{podName}</div>
                </Tooltip>
            }
            line2={null}
            iconProps={{
                render: (className?: string) => {
                    return (
                        <>
                        {
                            podStatusProps &&
                            <Tooltip text={statusTooltip}>
                                <div className="flex-row">
                                    <Status {...podStatusProps} className="icon-large-margin" size={StatusSize.m} />
                                </div>
                            </Tooltip>
                        }
                        </>
                    );
                }
            }}
        />
    ) : renderTableCell(rowIndex, columnIndex, tableColumn, null);
}

export function renderPodsStatusTableCell(
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<any>,
    podsCountString?: string,
    podsStatusProps?: IStatusProps,
    tooltip?: string,
    onClick?: () => void
): JSX.Element {
    const content = (
        <>
            {podsStatusProps && <Status {...podsStatusProps} size={StatusSize.m} />}
            <div className="k8s-pods-status-count">{podsCountString}</div>
        </>
    );

    const classNames = "fontSizeM font-size-m flex-center flex-row text-ellipsis";

    const itemToRender = podsCountString ? (
        // show tooltip always if specified, otherwise show only when element overflows
        <Tooltip text={tooltip || podsCountString || ""} overflowOnly={!tooltip}>
            {
                onClick ? (
                    <Link
                        className={css(classNames, "bolt-table-link")}
                        rel={"noopener noreferrer"}
                        excludeTabStop
                        onClick={() => onClick()}
                    >
                        {content}
                    </Link>)
                    : (<span className={classNames}>
                        {content}
                    </span>)}
        </Tooltip>
    ) : null;

    return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, podsCountString ? "bolt-table-cell-content-with-link" : "");
}

export function onPodsColumnClicked(
    pods: V1Pod[],
    item: V1ReplicaSet | V1StatefulSet | V1DaemonSet | V1Pod,
    itemKind: string,
    selectionActionCreator: SelectionActionsCreator): void {
    const selectedPod = pods.find(p => Utils.generatePodStatusProps(p.status).statusProps === Statuses.Failed) || pods[0];

    // Item kind "Pod" implies that the type is an orphan pod
    const properties = itemKind === "Pod" ? undefined : {
        parentUid: item.metadata.uid
    } as IPodDetailsSelectionProperties;

    selectionActionCreator.selectItem({
        item: selectedPod,
        itemUID: selectedPod.metadata.uid,
        selectedItemType: itemKind === "Pod" ? SelectedItemKeys.OrphanPodKey : SelectedItemKeys.PodDetailsKey,
        showSelectedItem: true,
        properties: properties
    });
}

export function renderExternalIpCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<any>, item: any, hoverHandler: (hoverRowIndex: number) => void, hoverRowIndex: number): JSX.Element {
    const textToRender = item.externalIP;
    if (textToRender) {
        const itemToRender = (
            <div
                className="external-ip-cell"
                onMouseOver={() => hoverHandler(rowIndex)}
                onMouseLeave={() => hoverHandler(-1)}
                onFocus={() => hoverHandler(rowIndex)}
                onBlur={() => hoverHandler(-1)}
                tabIndex={0}>
                {textToRender}
                {hoverRowIndex === rowIndex &&
                    <Button
                        onClick={(e) => {
                            Utils.copyToClipboard(textToRender);
                            e.preventDefault();
                        }}
                        tooltipProps={{ text: Resources.CopyExternalIp }}
                        ariaLabel={Resources.CopyExternalIp}
                        iconProps={{ iconName: "Copy" }}
                        className="external-ip-copy-icon">
                    </Button>}
            </div>
        );

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
    else {
        return renderTableCell(rowIndex, columnIndex, tableColumn, textToRender || "-");
    }
}