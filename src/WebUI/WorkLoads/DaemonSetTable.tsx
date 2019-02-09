import { V1DaemonSet, V1DaemonSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Utils } from "../Utils";
import { ResourceStatus } from "../Common/ResourceStatus";
import { IKubeService } from "../../Contracts/Contracts";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { WorkloadsEvents, SelectedItemKeys } from "../Constants";
import { SelectionStore } from "../Selection/SelectionStore";
import { SelectionActions } from "../Selection/SelectionActions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";

const setNameKey = "set-name-key";
const imageKey = "image-key";
const podsKey = "pods-key";
const ageKey = "age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    kubeService: IKubeService;
    nameFilter?: string;
}

export interface IDeploymentsTableState {
    daemonSetList?: V1DaemonSetList;
}

export class DaemonSetTable extends BaseComponent<IDaemonSetComponentProperties, IDeploymentsTableState> {
    constructor(props: IDaemonSetComponentProperties) {
        super(props, {});

        this._actionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this._actionCreator.getDaemonSets(this.props.kubeService);

        this.state = { daemonSetList: undefined };

        this._store.addListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
    }

    public render(): React.ReactNode {
        const filteredItems: V1DaemonSet[] = (this.state.daemonSetList && this.state.daemonSetList.items || []).filter((item) => {
            return Utils.filterByName(item.metadata.name, this.props.nameFilter);
        });
        if (filteredItems.length > 0) {
            return (
                <BaseKubeTable
                    className={css("list-content", "top-padding", "depth-16")}
                    items={filteredItems}
                    columns={DaemonSetTable._getColumns()}
                    onItemActivated={this._openDaemonSetItem}
                />
            );
        }
        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
    }

    private _onDaemonSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            daemonSetList: storeState.daemonSetList
        });
    }

    private _openDaemonSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1DaemonSet) => {
        if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem, showSelectedItem: true, selectedItemType: SelectedItemKeys.DaemonSetKey });
        }
    }

    private static _getColumns(): ITableColumn<V1DaemonSet>[] {
        let columns: ITableColumn<V1DaemonSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.DaemonSetText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetTable._renderDaemonSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetTable._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetTable._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetTable._renderAgeCell
        });

        return columns;
    }

    private static _renderDaemonSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const itemToRender = BaseKubeTable.renderTwoLineColumn(daemonSet.metadata.name, Utils.getPipelineText(daemonSet.metadata.annotations), colDataClassName, "primary-text", "secondary-text");
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const textToRender = daemonSet.spec.template.spec.containers[0].image;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (daemonSet.status.desiredNumberScheduled > 0) {
            statusProps = Utils._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
            podString = format("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
        }

        const itemToRender = (
            <ResourceStatus
                statusProps={statusProps}
                statusDescription={podString}
            />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const itemToRender = (
            <Ago date={new Date(daemonSet.metadata.creationTimestamp)} />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _store: WorkloadsStore;
    private _actionCreator: WorkloadsActionsCreator;
}