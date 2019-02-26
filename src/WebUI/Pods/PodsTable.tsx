/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { Link } from "azure-devops-ui/Link";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { ITableColumn } from "azure-devops-ui/Table";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IResourceStatusProps } from "../Common/ResourceStatus";
import { SelectedItemKeys } from "../Constants";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import * as Resources from "../Resources";
import { SelectionActions } from "../Selection/SelectionActions";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./PodsTable.scss";

const podNameKey: string = "pl-name-key";
const podWorkloadsKey: string = "pl-wrkld-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const colDataClassName: string = "list-col-content";
const RunningStatusKey: string = "running";

export interface IPodsTableProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
    nameFilter?: string;
    showWorkloadsColumn?: boolean;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod) => void;
}

export class PodsTable extends BaseComponent<IPodsTableProperties> {
    public render(): React.ReactNode {
        const filteredPods: V1Pod[] = this.props.podsToRender.filter((pod) => {
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
                <BaseKubeTable
                    headingText={this.props.headingText}
                    headingDescription={this._generateHeadingSubText(this._statusCount)}
                    className={css("list-content", "pl-details", "depth-16")}
                    items={this.props.podsToRender}
                    columns={PodsTable._getColumns(this.props.showWorkloadsColumn || false)}
                    onItemActivated={this._showPodDetails}
                    showLines={true}
                />
            );
        }

        return null;
    }

    private static _getColumns(showWorkloadsColumn: boolean): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content", "pods-table-cell");

        let nameColumnWidth: number = 362;
        let statusColWidth: number = 256;

        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            width: showWorkloadsColumn ? -54 : 362,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodNameCell
        });

        if (showWorkloadsColumn) {
            columns.push({
                id: podWorkloadsKey,
                name: Resources.WorkloadText,
                width: -24,
                headerClassName: headerColumnClassName,
                className: columnContentClassName,
                renderCell: PodsTable._renderPodWorkload
            });
        }

        columns.push({
            id: podStatusKey,
            name: Resources.StatusText,
            width: showWorkloadsColumn ? 220 : 256,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodStatusCell
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            width: showWorkloadsColumn ? -18 : -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodAgeCell
        });
        return columns;
    }

    private _showPodDetails = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1Pod) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
        else if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem, showSelectedItem: true, selectedItemType: SelectedItemKeys.OrphanPodKey });
        }
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata.name;
        const statusProps: IResourceStatusProps = { statusProps: Utils.generatePodStatusProps(pod.status) }
        const itemToRender = BaseKubeTable.renderColumn(textToRender, BaseKubeTable.defaultColumnRenderer, css(colDataClassName, "primary-text"));
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, statusProps);
    }

    private static _renderPodWorkload(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata.ownerReferences.length > 0 ? pod.metadata.ownerReferences[0].name : ""; 
        const itemToRender: React.ReactNode = (
            <Link
                className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link"
                excludeTabStop
                href="#"
            >
                {textToRender}
            </Link>
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodStatusCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender: string = pod.status.message ? pod.status.reason : pod.status.phase;
        const itemToRender = BaseKubeTable.renderColumn(textToRender, BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = pod.status && pod.status.startTime ? <Ago date={new Date(pod.status.startTime)} /> : null;
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateHeadingSubText(podStatuses: { [key: string]: number }): string {
        let keys = Object.keys(podStatuses);
        let subText: string = "";
        let runningIndex = keys.indexOf(RunningStatusKey);
        if (runningIndex >= 0) {
            subText = localeFormat("{0} {1}", podStatuses[RunningStatusKey], RunningStatusKey);
            keys.splice(runningIndex, 1);
        }
        keys.forEach(key => {
            subText = localeFormat("{0} {1} {2}", podStatuses[key], key, subText);
        })
        return subText;
    }

    private _statusCount: { [key: string]: number } = {};
}
