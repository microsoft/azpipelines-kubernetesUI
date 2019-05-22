/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1OwnerReference, V1Pod } from "@kubernetes/client-node";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { ITableColumn, ITableRow, renderSimpleCell, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../../Resources";
import { renderPodNameWithStatusTableCell, renderTableCell } from "../Common/KubeCardWithTable";
import { Scenarios, SelectedItemKeys } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { getTelemetryService } from "../KubeFactory";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload, SelectionActions } from "../Selection/SelectionActions";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./PodsTable.scss";

const podNameKey: string = "pl-name-key";
const podWorkloadsKey: string = "pl-wrkld-key";
const podAgeKey: string = "pl-age-key";
const RunningStatusKey: string = "running";

export interface IPodsTableProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
    nameFilter?: string;
    showWorkloadColumn?: boolean;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, selectedItem: V1Pod) => void;
    contentClassName?: string;
}

export class PodsTable extends React.Component<IPodsTableProperties> {

    constructor(props: IPodsTableProperties) {
        super(props);
        if (!this.props.markTTICallback) {
            getTelemetryService().scenarioStart(Scenarios.PodsList);
        }
    }

    public render(): React.ReactNode {
        const showWorkloadColumn = this.props.showWorkloadColumn || false;
        const filteredPods: V1Pod[] = (this.props.podsToRender || []).filter((pod) => {
            return Utils.filterByName(pod.metadata.name, this.props.nameFilter);
        });

        if (filteredPods.length > 0) {
            this._prepareSubTextData(filteredPods);
            return (
                <CustomCard className="pods-associated k8s-card-padding flex-grow bolt-table-card bolt-card-no-vertical-padding">
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
                            columns={PodsTable._getColumns(showWorkloadColumn)}
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

    public componentDidMount() {
        if (!this.props.markTTICallback) {
            getTelemetryService().scenarioEnd(Scenarios.PodsList);
        }
    }

    private _prepareSubTextData(filteredPods: V1Pod[]): void {
        this._statusCount = {};
        filteredPods.forEach(pod => {
            const key = pod.status.message ? pod.status.reason : pod.status.phase;
            if (key in this._statusCount) {
                this._statusCount[key] += 1;
            } else {
                this._statusCount[key] = 1;
            }
        });
    }

    private static _getColumns(showWorkloadColumn: boolean): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            width: showWorkloadColumn ? -58 : new ObservableValue(362),
            renderCell: PodsTable._renderPodNameCell
        });


        if (showWorkloadColumn) {
            columns.push({
                id: podWorkloadsKey,
                name: Resources.WorkloadText,
                width: -24,
                renderCell: PodsTable._renderPodWorkload
            });
        }

        columns.push({
            id: "podStatus",
            name: Resources.StatusText,
            width: new ObservableValue(showWorkloadColumn ? 220 : 256),
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => {
                const textToRender: string = pod.status.message ? pod.status.reason : pod.status.phase;
                return renderSimpleCell(rowIndex, columnIndex, tableColumn as any, { "podStatus": textToRender });
            }
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            width: showWorkloadColumn ? -18 : -100,
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
        const { statusProps, tooltip } = Utils.generatePodStatusProps(pod.status);
        return renderPodNameWithStatusTableCell(rowIndex, columnIndex, tableColumn, pod.metadata.name, statusProps, tooltip, "body-m font-weight-semibold");
    }

    private static _renderPodWorkload(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata && pod.metadata.ownerReferences && pod.metadata.ownerReferences.length > 0 ? pod.metadata.ownerReferences[0].name || "" : "";
        const controllerOwner: V1OwnerReference | undefined = pod.metadata.ownerReferences && pod.metadata.ownerReferences.find(o => !!o.controller);
        const itemToRender: React.ReactNode = textToRender.length > 0 ? (
            <Tooltip overflowOnly>
                {
                    controllerOwner ?
                        (<Link
                            className="fontSizeM font-size-m text-ellipsis bolt-table-link"
                            rel={"noopener noreferrer"}
                            excludeTabStop
                            onClick={(e) => {
                                e.preventDefault();
                                PodsTable._onWorkloadClicked(pod, controllerOwner);
                            }}
                        >
                            {textToRender}
                        </Link>)
                        : textToRender
                }
            </Tooltip>
        ) : null;

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, textToRender && controllerOwner ? "bolt-table-cell-content-with-link" : "");
    }

    private static _onWorkloadClicked = (pod: V1Pod, controllerOwner: V1OwnerReference) => {
        let type: SelectedItemKeys = SelectedItemKeys.ReplicaSetKey;
        switch (controllerOwner.kind) {
            case "DaemonSet":
                type = SelectedItemKeys.DaemonSetKey;
                break;
            case "StatefulSet":
                type = SelectedItemKeys.StatefulSetKey;
                break;
        }

        const payload: ISelectionPayload = {
            item: undefined,
            itemUID: controllerOwner.uid,
            showSelectedItem: true,
            selectedItemType: type
        };

        ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator).selectItem(payload);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = pod.status && pod.status.startTime
            ? <Ago className="body-m" date={new Date(pod.status.startTime)} format={AgoFormat.Extended} />
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
            const suffix = subText ? localeFormat(" · {0}", subText) : "";
            subText = localeFormat("{0} {1}{2}", podStatuses[key], key, suffix);
        });

        return subText;
    }

    private _isTTIMarked: boolean = false;
    private _statusCount: { [key: string]: number } = {};
}
