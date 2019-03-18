/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1PodSpec, V1ReplicaSet, V1StatefulSet } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { format } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps } from "azure-devops-ui/Status";
import { ITableColumn, Table, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { defaultColumnRenderer, renderTableCell, renderPodsStatusTableCell } from "../Common/KubeCardWithTable";
import { SelectedItemKeys, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { ISetWorkloadTypeItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";
import "./OtherWorkloadsTable.scss";

const setNameKey = "otherwrkld-name-key";
const imageKey = "otherwrkld-image-key";
const podsKey = "otherwrkld-pods-key";
const ageKey = "otherwrkld-age-key";

export interface IOtherWorkloadsProperties extends IVssComponentProperties {
    kubeService: IKubeService;
    nameFilter?: string;
    typeFilter: KubeResourceType[];
}

export interface IOtherWorkloadsState {
    statefulSetList: V1StatefulSet[];
    daemonSetList: V1DaemonSet[];
    replicaSets: V1ReplicaSet[];
}

export class OtherWorkloads extends BaseComponent<IOtherWorkloadsProperties, IOtherWorkloadsState> {
    constructor(props: IOtherWorkloadsProperties) {
        super(props, {});

        this._actionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this.state = { statefulSetList: [], daemonSetList: [], replicaSets: [] };

        this._store.addListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.addListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);

        this._actionCreator.getStatefulSets(this.props.kubeService);
        this._actionCreator.getDaemonSets(this.props.kubeService);
        this._actionCreator.getReplicaSets(this.props.kubeService);
    }

    public render(): React.ReactNode {
        const filteredSet: ISetWorkloadTypeItem[] = this._generateRenderData().filter(set => {
            return Utils.filterByName(set.name, this.props.nameFilter);
        });

        if (filteredSet.length > 0) {
            return (
                <CustomCard className="workloads-other-content k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                    {Resources.OtherWorkloadsText}
                                </HeaderTitle>
                            </HeaderTitleRow>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className="workload-other-sets-table" contentPadding={false}>
                        <Table
                            id="other-workloads-table"
                            showHeader={true}
                            showLines={true}
                            singleClickActivation={true}
                            itemProvider={new ArrayItemProvider<ISetWorkloadTypeItem>(filteredSet)}
                            columns={OtherWorkloads._getColumns()}
                            onActivate={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                                this._openStatefulSetItem(event, tableRow, filteredSet[tableRow.index]);
                            }}
                        />
                    </CardContent>
                </CustomCard>
            );
        }

        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.removeListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
    }

    private _onStatefulSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            statefulSetList: storeState.statefulSetList && storeState.statefulSetList.items || []
        });
    }

    private _onDaemonSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            daemonSetList: storeState.daemonSetList && storeState.daemonSetList.items || []
        });
    }

    private _onReplicaSetsFetched = (): void => {
        const storeState = this._store.getState();
        const allReplicaSets = storeState.replicaSetList && storeState.replicaSetList.items || [];
        const standAloneReplicaSets = allReplicaSets.filter(set => set.metadata.ownerReferences.length === 0);
        this.setState({
            replicaSets: standAloneReplicaSets
        })
    }

    private _openStatefulSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: ISetWorkloadTypeItem) => {
        if (selectedItem) {
            const payload: ISelectionPayload = {
                item: selectedItem.payload,
                itemUID: selectedItem.uid,
                showSelectedItem: true,
                selectedItemType: selectedItem.kind
            };

            this._selectionActionCreator.selectItem(payload);
        }
    }

    private static _getColumns(): ITableColumn<ISetWorkloadTypeItem>[] {
        let columns: ITableColumn<ISetWorkloadTypeItem>[] = [];
        columns.push({
            id: setNameKey,
            name: Resources.NameText,
            width: 348,
            renderCell: OtherWorkloads._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: -72,
            renderCell: OtherWorkloads._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 140,
            renderCell: OtherWorkloads._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -28,
            renderCell: OtherWorkloads._renderAgeCell
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        return (
            <TwoLineTableCell
                key={"col-" + columnIndex}
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                line1={
                    <Tooltip overflowOnly={true} text={statefulSet.name}>
                        <span className="fontWeightSemiBold text-ellipsis">{statefulSet.name}</span>
                    </Tooltip>
                }
                line2={<span className="fontSize secondary-text text-ellipsis">{OtherWorkloads._getSetType(statefulSet.kind)}</span>}
            />
        );
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        const itemToRender = defaultColumnRenderer(statefulSet.image || "", undefined, statefulSet.imageTooltip || "");
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (statefulSet.desiredPodCount > 0) {
            statusProps = Utils.getPodsStatusProps(statefulSet.desiredPodCount, statefulSet.currentPodCount);
            podString = format("{0}/{1}", statefulSet.desiredPodCount, statefulSet.currentPodCount);
        }

        return renderPodsStatusTableCell(rowIndex, columnIndex, tableColumn, podString, statusProps);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        const itemToRender = <Ago date={new Date(statefulSet.creationTimeStamp)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateRenderData(): ISetWorkloadTypeItem[] {
        let data: ISetWorkloadTypeItem[] = [];
        this._showType(KubeResourceType.StatefulSets) && this.state.statefulSetList.forEach(set => {
            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.StatefulSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.currentReplicas,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        this._showType(KubeResourceType.DaemonSets) && this.state.daemonSetList.forEach(set => {
            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.DaemonSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                desiredPodCount: set.status.desiredNumberScheduled,
                currentPodCount: set.status.currentNumberScheduled,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        this._showType(KubeResourceType.ReplicaSets) && this.state.replicaSets.forEach(set => {
            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.ReplicaSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.availableReplicas,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        return data;
    }

    private _showType(type: KubeResourceType): boolean {
        return (this.props.typeFilter.length == 0 || this.props.typeFilter.indexOf(type) >= 0);
    }

    private static _getImageText(spec: V1PodSpec): { image: string, imageTooltip?: string } {
        const { imageText, imageTooltipText } = Utils.getImageText(spec);
        return { image: imageText, imageTooltip: imageTooltipText };
    }

    private static _getSetType(selectedItem: string): string {
        switch (selectedItem) {
            case SelectedItemKeys.DaemonSetKey:
                return Resources.DaemonSetText;
            case SelectedItemKeys.ReplicaSetKey:
                return Resources.ReplicaSetText;
            case SelectedItemKeys.StatefulSetKey:
                return Resources.StatefulSetText;
        }

        return "";
    }

    private _store: WorkloadsStore;
    private _actionCreator: WorkloadsActionsCreator;
    private _selectionActionCreator: SelectionActionsCreator;
}