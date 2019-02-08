import { V1StatefulSet, V1StatefulSetList } from "@kubernetes/client-node";
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
import { WorkloadsEvents } from "../Constants";
import { SelectionStore } from "../Selection/SelectionStore";
import { SelectionActions } from "../Selection/SelectionActions";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";

const setNameKey = "statefulset-name-key";
const imageKey = "statefulset-image-key";
const podsKey = "statefulset-pods-key";
const ageKey = "statefulset-age-key";
const colDataClassName: string = "list-col-content";

export interface IStatefulSetTableProperties extends IVssComponentProperties {
    kubeService: IKubeService;
    nameFilter?: string;
}

export interface IStatefulSetTableState {
    statefulSetList?: V1StatefulSetList;
}

export class StatefulSetTable extends BaseComponent<IStatefulSetTableProperties, IStatefulSetTableState> {
    constructor(props: IStatefulSetTableProperties) {
        super(props, {});

        this._actionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this._actionCreator.getStatefulSets(this.props.kubeService);

        this.state = { statefulSetList: undefined };

        this._store.addListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
    }

    public render(): React.ReactNode {
        const filteredSet: V1StatefulSet[] = (this.state.statefulSetList && this.state.statefulSetList.items || []).filter((set) => {
            return Utils.filterByName(set.metadata.name, this.props.nameFilter);
        });
        if (filteredSet.length > 0) {
            return (
                <BaseKubeTable
                    className={css("list-content", "top-padding", "depth-16")}
                    items={filteredSet}
                    columns={StatefulSetTable._getColumns()}
                    onItemActivated={this._openStatefulSetItem}
                />
            );
        }
        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
    }

    private _onStatefulSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            statefulSetList: storeState.statefulSetList
        });
    }

    private _openStatefulSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1StatefulSet) => {
        if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem, showSelectedItem: true });
        }
    }

    private static _getColumns(): ITableColumn<V1StatefulSet>[] {
        let columns: ITableColumn<V1StatefulSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.StatefulSetText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            renderCell: StatefulSetTable._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetTable._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetTable._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetTable._renderAgeCell
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const itemToRender = BaseKubeTable.renderTwoLineColumn(statefulSet.metadata.name, Utils.getPipelineText(statefulSet.metadata.annotations), colDataClassName, "primary-text", "secondary-text");
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const textToRender = statefulSet.spec.template.spec.containers[0].image;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (statefulSet.status.replicas > 0) {
            statusProps = Utils._getPodsStatusProps(statefulSet.status.currentReplicas, statefulSet.status.replicas);
            podString = format("{0}/{1}", statefulSet.status.currentReplicas, statefulSet.status.replicas);
        }

        const itemToRender = (
            <ResourceStatus
                statusProps={statusProps}
                statusDescription={podString}
            />
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const itemToRender = (<Ago date={new Date(statefulSet.metadata.creationTimestamp)} />);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _store: WorkloadsStore;
    private _actionCreator: WorkloadsActionsCreator;
}