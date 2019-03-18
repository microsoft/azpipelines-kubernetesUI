/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { defaultColumnRenderer, renderPodNameWithStatusTableCell, renderTableCell } from "../Common/KubeCardWithTable";
import { SelectedItemKeys } from "../Constants";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import * as Resources from "../Resources";
import { SelectionActions } from "../Selection/SelectionActions";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import "./PodsTable.scss";

const podNameKey: string = "pl-name-key";
const podWorkloadsKey: string = "pl-wrkld-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const RunningStatusKey: string = "running";

export interface IPodsTableProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
    nameFilter?: string;
    showWorkloadsColumn?: boolean;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod) => void;
    contentClassName?: string;
}

export class PodsTable extends BaseComponent<IPodsTableProperties> {
    public render(): React.ReactNode {
        const filteredPods: V1Pod[] = (this.props.podsToRender || []).filter((pod) => {
            return Utils.filterByName(pod.metadata.name, this.props.nameFilter);
        });

        if (filteredPods.length > 0) {
            filteredPods.forEach(pod => {
                const key = (pod.status.message ? pod.status.reason : pod.status.phase).toLowerCase();
                if (key in this._statusCount) {
                    this._statusCount[key] += 1;
                } else {
                    this._statusCount[key] = 1;
                }
            });

            return (
                <CustomCard className="pods-associated k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                    {this.props.headingText}
                                </HeaderTitle>
                            </HeaderTitleRow>
                            <HeaderDescription className={"text-ellipsis"}>
                                {this._generateHeadingSubText(this._statusCount)}
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className={css(this.props.contentClassName || "", "pod-associated-table")} contentPadding={false}>
                        <Table
                            id="pods-table"
                            showHeader={true}
                            showLines={true}
                            columns={PodsTable._getColumns(this.props.showWorkloadsColumn || false)}
                            itemProvider={new ArrayItemProvider<V1Pod>(filteredPods)}
                            pageSize={filteredPods.length}
                            singleClickActivation={true}
                            onActivate={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                                this._showPodDetails(event, tableRow, filteredPods[tableRow.index]);
                            }}
                        />
                    </CardContent>
                </CustomCard>
            );
        }

        return null;
    }

    private static _getColumns(showWorkloadsColumn: boolean): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            width: showWorkloadsColumn ? -58 : 362,
            renderCell: PodsTable._renderPodNameCell
        });

        columns.push({
            id: podStatusKey,
            name: Resources.StatusText,
            width: showWorkloadsColumn ? 220 : 256,
            renderCell: PodsTable._renderPodStatusCell
        });

        if (showWorkloadsColumn) {
            columns.push({
                id: podWorkloadsKey,
                name: Resources.WorkloadText,
                width: -24,
                renderCell: PodsTable._renderPodWorkload
            });
        }

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            width: showWorkloadsColumn ? -18 : -100,
            renderCell: PodsTable._renderPodAgeCell
        });

        return columns;
    }

    private _showPodDetails = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1Pod) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
        else if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke(
                {
                    item: selectedItem,
                    itemUID: selectedItem.metadata.uid,
                    showSelectedItem: true,
                    selectedItemType: SelectedItemKeys.OrphanPodKey
                });
        }
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        return renderPodNameWithStatusTableCell(rowIndex, columnIndex, tableColumn, pod.metadata.name, Utils.generatePodStatusProps(pod.status), pod.status.message || pod.status.phase);
    }

    private static _renderPodWorkload(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata && pod.metadata.ownerReferences && pod.metadata.ownerReferences.length > 0 ? pod.metadata.ownerReferences[0].name || "" : "";
        const contentClassName = "bolt-table-cell-content-with-inline-link no-v-padding";
        const itemToRender: React.ReactNode = textToRender.length > 0 ? (
            <div className="bolt-table-two-line-cell-item flex-row scroll-hidden">
                <Tooltip text={textToRender} overflowOnly>
                    <Link
                        className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link bolt-link"
                        excludeTabStop
                        href="#"
                    >
                        {textToRender}
                    </Link>
                </Tooltip>
            </div>
        ) : null;

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
    }

    private static _renderPodStatusCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender: string = pod.status.message ? pod.status.reason : pod.status.phase;
        const itemToRender = defaultColumnRenderer(textToRender);
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = pod.status && pod.status.startTime
            ? <Ago date={new Date(pod.status.startTime)} format={AgoFormat.Extended} />
            : null;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateHeadingSubText(podStatuses: { [key: string]: number }): string {
        let keys = Object.keys(podStatuses);
        let subText: string = "";
        const runningIndex = keys.indexOf(RunningStatusKey);

        if (runningIndex >= 0) {
            subText = localeFormat("{0} {1}", podStatuses[RunningStatusKey], RunningStatusKey);
            keys.splice(runningIndex, 1);
        }

        keys.forEach(key => {
            const suffix = subText ? localeFormat(" . {0}", subText) : "";
            subText = localeFormat("{0} {1}{2}", podStatuses[key], key, suffix);
        });

        return subText;
    }

    private _statusCount: { [key: string]: number } = {};
}
