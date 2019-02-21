/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1Pod, V1PodTemplateSpec } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { Card } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { format } from "azure-devops-ui/Core/Util/String";
import { Duration } from "azure-devops-ui/Duration";
import { TitleSize } from "azure-devops-ui/Header";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { ResourceStatus } from "../Common/ResourceStatus";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
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
    parentName: string;
    onSelectionChange?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod) => void;
}

export class PodsLeftPanel extends BaseComponent<IPodsLeftPanelProperties> {
    public render(): JSX.Element {
        return (
            <div className="pods-left-panel-container">
                {this._getHeader()}
                {this._getPodsList()}
            </div>
        );
    }

    private _onSelectionChange = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(event, this.props.pods[tableRow.index]);
        }
    }

    private _getHeader(): JSX.Element | null {
        /* ToDo :: Add back button here when we have support for the same */
        return (<h2 className="pod-left-panel-header">{this.props.parentName}</h2>);
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
            renderCell: PodsLeftPanel._renderPodNameCell
        });

        return (
            this.props.pods && this.props.pods.length > 0 ?
                <div>
                    <div className="pod-left-panel-table-header">{Resources.PodsListHeaderText}</div>
                    <Table
                        itemProvider={new ArrayItemProvider<V1Pod>(this.props.pods)}
                        columns={columns}
                        showHeader={false}
                        showLines={true}
                        singleClickActivation={false}
                        onSelect={this._onSelectionChange}
                        //focuszoneProps={{focusOnMount: true}}
                    />
                </div> : null
        );
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        let { key, value } = tableItem;
        switch (key) {
            case Resources.Created:
                value = (<span className="pods-left-panel-header-created-cell">
                    <Duration startDate={value} endDate={new Date()} />
                    {format("{0}", Resources.Ago)}
                </span>);
                break;
            case Resources.LabelsText:
                value = <LabelGroup
                    labelProps={Utils.getUILabelModelArray(value)}
                    wrappingBehavior={WrappingBehavior.freeFlow}
                    fadeOutOverflow={true}
                />;
                break;
        }

        let itemToRender = <div className="kube-simple-cell">
            <span className="pods-left-panel-header-key">{key + ": "}</span>
            <span className="pods-left-panel-header-value">{value}</span>
        </div>;
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = (
            <ResourceStatus
                statusProps={podStatusDic[pod.status.phase]}
                statusDescription={pod.metadata.name}
            />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
}
