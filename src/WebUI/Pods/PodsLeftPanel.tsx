/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";

import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IListSelection, ListSelection, List, IListItemDetails, ListItem } from "azure-devops-ui/List";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { css } from "azure-devops-ui/Util";
import { createBrowserHistory } from "history";
import * as queryString from "query-string";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./PodsLeftPanel.scss";

export interface IPodsLeftPanelProperties extends IVssComponentProperties {
    pods: V1Pod[];
    parentName: string;
    selectedPodName?: string;
    parentKind: string;
    onSelectionChange?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod, selectedView: string) => void;
}

export class PodsLeftPanel extends React.Component<IPodsLeftPanelProperties> {
    public render(): React.ReactNode {
        return (
            this.props.pods && this.props.pods.length > 0 ?
                <List
                    itemProvider={new ArrayItemProvider<V1Pod>(this.props.pods)}
                    onSelect={this._onSelectionChange}
                    selection={this._selection}
                    renderRow={PodsLeftPanel._renderListRow}
                    width="100%"
                />
                : null
        );
    }

    public componentDidMount(): void {
        if (this.props.pods && this.props.pods.length) {
            this._selectPod();
        }
    }

    public componentDidUpdate(prevProps: IPodsLeftPanelProperties): void {
        if (!(prevProps.pods && prevProps.pods.length) && (this.props.pods && this.props.pods.length)) {
            this._selectPod();
        }
    }

    private _onSelectionChange = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        this._selectedRow = tableRow.index;
        const historyService = createBrowserHistory();
        const queryParams = queryString.parse(historyService.location.search);
        const selectedView = queryParams["view"];
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(event, this.props.pods[tableRow.index], (typeof selectedView === "string") ? selectedView : "");
        }
    }


    private static _renderListRow = (index: number, pod: V1Pod, details: IListItemDetails<V1Pod>, key?: string): JSX.Element => {
        const { statusProps, tooltip } = Utils.generatePodStatusProps(pod.status);
        const rowClassName = index === 0 ? css("pods-left-panel-row", "first-row") : "pods-left-panel-row";

        return (
            <ListItem className={rowClassName} key={key || "list-item" + index} index={index} details={details}>
                <div className="pod-text-status-container flex-row flex-center h-scroll-hidden">
                    <div className="pod-noshrink flex-noshrink" />
                    <div className="pod-shrink flex-row flex-center flex-shrink">
                        {
                            statusProps &&
                            <Tooltip text={tooltip}>
                                <div className="flex-row">
                                    <Status {...statusProps} className="icon-large-margin" size={StatusSize.m} />
                                </div>
                            </Tooltip>
                        }
                        <Tooltip overflowOnly={true} text={pod.metadata.name}>
                            <div className="primary-text text-ellipsis">{pod.metadata.name}</div>
                        </Tooltip>
                    </div>
                </div>
            </ListItem>
        );
    }

    private _selectPod(): void {
        const selectedPodName = this.props.selectedPodName;
        if (!this._hasSelected) {
            if (selectedPodName) {
                this._selectedRow = (this.props.pods || []).findIndex(pod => pod.metadata.name === selectedPodName);
            }

            if (this._selectedRow === -1 || this._selectedRow >= (this.props.pods || []).length) {
                this._selectedRow = 0;
            }

            // select the first pod in left panel by default
            this._selection.select(this._selectedRow);
            this._hasSelected = true;
        }
    }

    private _selection: IListSelection = new ListSelection({ selectOnFocus: true });
    private _hasSelected: boolean = false;
    private _selectedRow: number = -1;
}
