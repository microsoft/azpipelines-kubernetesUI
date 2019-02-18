import { BaseComponent, css, format } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import * as React from "react";
import * as Resources from "../Resources";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IVssComponentProperties } from "../Types";
import "./PodsTable.scss";
import { V1Pod } from "@kubernetes/client-node";
import { Utils } from "../Utils";
import { Status } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ITableColumn } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ResourceStatus } from "../Common/ResourceStatus";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { SelectionActions } from "../Selection/SelectionActions";
import { SelectedItemKeys } from "../Constants";
import { Link } from "azure-devops-ui/Link";

const podNameKey: string = "pl-name-key";
const podWorkloadsKey: string = "pl-wrkld-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const colDataClassName: string = "list-col-content";

export interface IPodsTableProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
    nameFilter?: string;
    showWorkloads?: boolean;
}

export class PodsTable extends BaseComponent<IPodsTableProperties> {
    private statusCount: { [key: string]: number } = {};
    public render(): React.ReactNode {
        const filteredPods: V1Pod[] = this.props.podsToRender.filter((pod) => {
            return Utils.filterByName(pod.metadata.name, this.props.nameFilter);
        });

        if (filteredPods.length > 0) {
            filteredPods.forEach(pod => {
                const key = (pod.status.message ? pod.status.reason : pod.status.phase).toLowerCase();
                if (key in this.statusCount) {
                    this.statusCount[key] += 1;
                } else {
                    this.statusCount[key] = 1;
                }
            });
            return (
                <BaseKubeTable
                    headingContent={
                        <div>
                            <h3 className={"heading-title"}>{this.props.headingText}</h3>
                            <span className={"secondary-text"}>{this._generateHeadingSubText(this.statusCount)}</span>
                        </div>
                    }
                    className={css("list-content", "pl-details", "depth-16")}
                    items={this.props.podsToRender}
                    columns={PodsTable._getColumns(this.props.showWorkloads || false)}
                    onItemActivated={this._showPodDetails}
                />
            );
        }

        return null;
    }

    private static _getColumns(showWorkloads: boolean): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content");

        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: PodsTable._renderPodNameCell
        });

        columns.push({
            id: podStatusKey,
            name: Resources.StatusText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodStatusCell
        });

        if (showWorkloads) {
            columns.push({
                id: podWorkloadsKey,
                name: Resources.WorkloadText,
                minWidth: 120,
                width: -100,
                headerClassName: headerColumnClassName,
                className: columnContentClassName,
                renderCell: PodsTable._renderPodWorkload
            });
        }

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodAgeCell
        });
        return columns;
    }

    private _showPodDetails = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1Pod) => {
        if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem, showSelectedItem: true, selectedItemType: SelectedItemKeys.OrphanPodKey });
        }
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata.name;
        let colDataClass = css(colDataClassName, "primary-text");
        const nameLabel = <span className={colDataClass}> {textToRender} </span>
        const itemToRender = (
            <ResourceStatus
                statusProps={Utils.generatePodStatusProps(pod.status)}
                customDescription={nameLabel}
            />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodWorkload(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata.ownerReferences[0].name;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        //could not change link color to black hence commenting for now.
        // const itemToRender: React.ReactNode = (
        //     <Link
        //         className=""
        //         excludeTabStop
        //         href="#"
        //     >
        //         {textToRender}
        //     </Link>
        // );
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
        let runningIndex = keys.indexOf("running");
        if (runningIndex >= 0) {
            subText = format("{0} {1}", podStatuses["running"], "running");
            keys.splice(runningIndex, 1);
        }
        keys.forEach(key => {
            subText = format("{0} {1} {2}", podStatuses[key], key, subText);
        })
        return subText;
    }
}
