/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IListSelection, ListSelection } from "azure-devops-ui/List";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import "./PodsLeftPanel.scss";

const podStatusDic: { [index: string]: IStatusProps } = {
    "Running": Statuses.Success,
    "Pending": Statuses.Waiting,
    "Succeeded": Statuses.Success,
    "Failed": Statuses.Failed,
};

const podStatusKey = "pods-list-status-col";
const colDataClassName: string = "list-col-content";

export interface IPodsLeftPanelProperties extends IVssComponentProperties {
    pods: V1Pod[];
    selectedPodName?: string;
    parentName: string;
    parentKind: string;
    onSelectionChange?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod) => void;
    onBackButtonClick?: () => void;
}

export class PodsLeftPanel extends BaseComponent<IPodsLeftPanelProperties> {
    public render(): JSX.Element {
        return (
            <>
                {this._getHeader()}
                {this._getPodsList()}
            </>
        );
    }

    public componentDidMount() {
        const selectedPodName = this.props.selectedPodName;
        if (!this._hasSelected) {
            if (selectedPodName) {
                this._selectedRow = (this.props.pods || []).findIndex(pod => pod.metadata.name === selectedPodName);
            }

            if (this._selectedRow === -1 || this._selectedRow >= (this.props.pods || []).length ) {
                this._selectedRow = 0;
            }

            // Select the first pod in left panel by default
            this._selection.select(this._selectedRow);
            this._hasSelected = true;
        }
    }

    private _onSelectionChange = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        this._selectedRow = tableRow.index;
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(event, this.props.pods[tableRow.index]);
        }
    }

    private _getHeader(): JSX.Element | null {
        return (
            <Header
                title={this.props.parentName}
                titleIconProps={{ iconName: "Back", onClick: this.props.onBackButtonClick, className: "pod-left-panel-back-button" }}
                titleSize={TitleSize.Large}
                description={this.props.parentKind || ""}
                className={"pod-left-panel-header"}
            />
        );
    }

    private _getPodsList(): JSX.Element | null {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName = "pod-left-panel-table-header";
        columns.push({
            id: podStatusKey,
            name: Resources.PodsListHeaderText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => {
                return PodsLeftPanel._renderPodNameCell(rowIndex, columnIndex, tableColumn, pod, this._selectedRow);
            }
        });

        return (
            this.props.pods && this.props.pods.length > 0 ?
                <>
                    <Header
                        title={Resources.PodsListHeaderText}
                        titleSize={TitleSize.Small}
                        className={"pod-left-panel-table-header fontWeightSemiBold"}
                    />
                    <Table
                        itemProvider={new ArrayItemProvider<V1Pod>(this.props.pods)}
                        columns={columns}
                        showHeader={false}
                        showLines={true}
                        onSelect={this._onSelectionChange}
                        selection={this._selection}
                    />
                </> : null
        );
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod, selectedIndex: number): JSX.Element {
        const itemToRender = (
            <>
                <Status {...podStatusDic[pod.status.phase]} className="icon-large-margin" size={StatusSize.m} />
                <div className="flex-row scroll-hidden">
                    <Tooltip overflowOnly text={pod.metadata.name}>
                        <span className={css("text-ellipsis", rowIndex === selectedIndex ? "fontWeightSemiBold" : "")}>{pod.metadata.name}</span>
                    </Tooltip>
                </div>
            </>
        );

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _selection: IListSelection = new ListSelection();
    private _hasSelected: boolean = false;
    private _selectedRow: number = -1;
}
