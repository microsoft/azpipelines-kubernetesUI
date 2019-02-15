import { V1StatefulSet, V1DaemonSet, V1ReplicaSet } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IStatusProps } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IVssComponentProperties, ISetWorkloadTypeItem } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn } from "azure-devops-ui/Table";
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
import { KubeResourceType } from '../../Contracts/KubeServiceBase';
import { Link } from "azure-devops-ui/Link";

const setNameKey = "otherwrkld-name-key";
const imageKey = "otherwrkld-image-key";
const podsKey = "otherwrkld-pods-key";
const ageKey = "otherwrkld-age-key";
const colDataClassName: string = "list-col-content";

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
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this.state = { statefulSetList:[], daemonSetList:[], replicaSets:[] };

        this._store.addListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.addListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);

        this._actionCreator.getStatefulSets(this.props.kubeService);
        this._actionCreator.getDaemonSets(this.props.kubeService);
        this._actionCreator.getReplicaSets(this.props.kubeService);
    }

    public render(): React.ReactNode {
        const filteredSet: ISetWorkloadTypeItem[] = this._generateRenderData().filter((set) => {
            return Utils.filterByName(set.name, this.props.nameFilter);
        });
        if (filteredSet.length > 0) {
            return (
                <BaseKubeTable
                    className={css("list-content", "top-padding", "depth-16")}
                    items={filteredSet}
                    columns={OtherWorkloads._getColumns()}
                    onItemActivated={this._openStatefulSetItem}
                    headingText={Resources.OtherWorkloadsText}
                />
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
        const standAloneReplicaSets = allReplicaSets.filter((set) => {
            return set.metadata.ownerReferences.length == 0;
        } )
        this.setState({
            replicaSets: standAloneReplicaSets
        })
    }

    private _openStatefulSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: ISetWorkloadTypeItem) => {
        if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem.payload, showSelectedItem: true, selectedItemType: selectedItem.kind });
        }
    }

    private static _getColumns(): ITableColumn<ISetWorkloadTypeItem>[] {
        let columns: ITableColumn<ISetWorkloadTypeItem>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        columns.push({
            id: setNameKey,
            name: Resources.NameText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName),
            className: colDataClassName,
            renderCell: OtherWorkloads._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: OtherWorkloads._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: OtherWorkloads._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: OtherWorkloads._renderAgeCell
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        return BaseKubeTable.renderTwoLineColumn(columnIndex, tableColumn, statefulSet.name, OtherWorkloads._getSetType(statefulSet.kind), css(colDataClassName,"two-lines"), "primary-text", "secondary-text");
        //return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        const itemToRender = BaseKubeTable.renderColumn(statefulSet.image || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (statefulSet.desiredPodCount > 0) {
            statusProps = Utils._getPodsStatusProps(statefulSet.desiredPodCount, statefulSet.currentPodCount);
            podString = format("{0}/{1}", statefulSet.desiredPodCount, statefulSet.currentPodCount);
        }

        const itemToRender = (
            <Link
                className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link"
                excludeTabStop
                href="#"
            >
                <ResourceStatus
                    statusProps={statusProps}
                    statusDescription={podString}
                />
            </Link>
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        const itemToRender = (<Ago date={new Date(statefulSet.creationTimeStamp)} />);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateRenderData(): ISetWorkloadTypeItem[] {
        let data: ISetWorkloadTypeItem[] = [];
        this._showType(KubeResourceType.StatefulSets) && this.state.statefulSetList.forEach((set) => {
            data.push({
                name: set.metadata.name,
                kind: SelectedItemKeys.StatefulSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                image: Utils.getImageText(set.spec.template.spec.containers),
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.currentReplicas,
                payload: set
            });
        });

        this._showType(KubeResourceType.DaemonSets) && this.state.daemonSetList.forEach((set) => {
            data.push({
                name: set.metadata.name,
                kind: SelectedItemKeys.DaemonSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                image: Utils.getImageText(set.spec.template.spec.containers),
                desiredPodCount: set.status.desiredNumberScheduled,
                currentPodCount: set.status.currentNumberScheduled,
                payload: set,
            });
        });

        this._showType(KubeResourceType.ReplicaSets) && this.state.replicaSets.forEach((set) => {
            data.push({
                name: set.metadata.name,
                kind: SelectedItemKeys.ReplicaSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                image: Utils.getImageText(set.spec.template.spec.containers),
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.availableReplicas,
                payload: set,
            });
        });
        return data;
    }

    private _showType(type: KubeResourceType): boolean {
        return (this.props.typeFilter.length == 0 || this.props.typeFilter.indexOf(type) >= 0);
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
}