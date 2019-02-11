import { BaseComponent, css } from "@uifabric/utilities";
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

const podNameKey: string = "pl-name-key";
const podImageKey: string = "pl-image-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const colDataClassName: string = "list-col-content";

export interface IPodsTableProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
    nameFilter?: string;
}

export class PodsTable extends BaseComponent<IPodsTableProperties> {
    public render(): React.ReactNode {
        const filteredPods: V1Pod[] = this.props.podsToRender.filter((pod) => {
            return Utils.filterByName(pod.metadata.name, this.props.nameFilter);
        });

        if (filteredPods.length > 0) {
            return (
                <BaseKubeTable
                    headingText={this.props.headingText}
                    className={css("list-content", "pl-details", "depth-16")}
                    items={this.props.podsToRender}
                    columns={PodsTable._getColumns()}
                    onItemActivated={this._showPodDetails}
                />
            );
        }

        return null;
    }

    private static _getColumns(): ITableColumn<V1Pod>[] {
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
            id: podImageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsTable._renderPodImageCell
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
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClass);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.spec.containers[0].image;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodStatusCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        let statusDescription: string = "";
        let customDescription: React.ReactNode = null;

        if (pod.status.message) {
            customDescription = <Tooltip showOnFocus={true} text={pod.status.message}>{pod.status.reason}</Tooltip>;
        }
        else {
            statusDescription = pod.status.phase;
        }

        const itemToRender = (
            <ResourceStatus
                statusProps={Utils.generatePodStatusProps(pod.status)}
                statusDescription={statusDescription}
                customDescription={customDescription}
            />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = (
            <Ago date={new Date(pod.status.startTime)} />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
}
