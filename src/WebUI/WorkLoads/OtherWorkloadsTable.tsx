/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1StatefulSet, V1DaemonSet, V1ReplicaSet, V1PodList, V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { IStatusProps } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { IVssComponentProperties, ISetWorkloadTypeItem } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Utils } from "../Utils";
import { ResourceStatus } from "../Common/ResourceStatus";
import { IKubeService, IImageService } from "../../Contracts/Contracts";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { WorkloadsEvents, SelectedItemKeys, ImageDetailsEvents } from "../Constants";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { Link } from "azure-devops-ui/Link";
import { format, equals } from "azure-devops-ui/Core/Util/String";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ImageDetailsActionsCreator } from "../ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { IImageDetails } from "../../Contracts/Types";
import { PodsStore } from "../Pods/PodsStore";
import { KubeSummary } from "../Common/KubeSummary";

const setNameKey = "otherwrkld-name-key";
const imageKey = "otherwrkld-image-key";
const podsKey = "otherwrkld-pods-key";
const ageKey = "otherwrkld-age-key";
const colDataClassName: string = "list-col-content";

export interface IOtherWorkloadsProperties extends IVssComponentProperties {
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
        this._imageActionsCreator = ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);

        this.state = { statefulSetList: [], daemonSetList: [], replicaSets: [] };

        this._store.addListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.addListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._imageDetailsStore.addListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);

        this._actionCreator.getStatefulSets(KubeSummary.getKubeService());
        this._actionCreator.getDaemonSets(KubeSummary.getKubeService());
        this._actionCreator.getReplicaSets(KubeSummary.getKubeService());
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
                    columns={this._getColumns()}
                    onItemActivated={this._openStatefulSetItem}
                    headingText={Resources.OtherWorkloadsText}
                />
            );
        }
        return null;
    }

    public componentDidUpdate(): void {
        const imageService = KubeSummary.getImageService();
        imageService && this._imageActionsCreator.setHasImageDetails(imageService, this._imageList);
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.removeListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._imageDetailsStore.removeListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
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
        })
        this.setState({
            replicaSets: standAloneReplicaSets
        })
    }

    private _setHasImageDetails = (): void => {
        const hasImageDetails = this._imageDetailsStore.getHasImageDetailsList();
        this._hasImageDetails = hasImageDetails;
        this.setState({});
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

    private _getColumns = (): ITableColumn<ISetWorkloadTypeItem>[] => {
        let columns: ITableColumn<ISetWorkloadTypeItem>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        columns.push({
            id: setNameKey,
            name: Resources.NameText,
            width: 348,
            headerClassName: css(headerColumnClassName),
            className: colDataClassName,
            renderCell: OtherWorkloads._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: -72,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: this._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 140,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: OtherWorkloads._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -18,
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: OtherWorkloads._renderAgeCell
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element {
        return (
            <TwoLineTableCell
                key={"col-" + columnIndex}
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                line1={
                    <Tooltip overflowOnly={true} text={workload.name}>
                        <span className="fontWeightSemiBold text-ellipsis">{workload.name}</span>
                    </Tooltip>
                }
                line2={<span className="fontSize secondary-text text-ellipsis">{OtherWorkloads._getSetType(workload.kind)}</span>}
            />
        );
    }

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element => {
        const imageId = workload.imageId;
        const imageText = workload.imageDisplayText;
        // ToDo :: HardCoding hasImageDetails true for the time being, Should change it once we integrate with ImageService
        // ToDo :: Revisit link paddings
        //const hasImageDetails: boolean = this._hasImageDetails && this._hasImageDetails.hasOwnProperty(imageId) ? this._hasImageDetails[imageId] : false;
        const hasImageDetails = true;
        const itemToRender =
            <Tooltip text={imageText} overflowOnly>
                <Link
                    className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link bolt-link"
                    onClick={() => hasImageDetails && this._onImageClick(KubeSummary.getImageService(), imageId, workload.uid)}>
                    {imageText || ""}
                </Link>
            </Tooltip>;

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (workload.desiredPodCount > 0) {
            statusProps = Utils._getPodsStatusProps(workload.desiredPodCount, workload.currentPodCount);
            podString = format("{0}/{1}", workload.desiredPodCount, workload.currentPodCount);
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
            </Link >
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element {
        const itemToRender = (<Ago date={new Date(workload.creationTimeStamp)} />);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateRenderData(): ISetWorkloadTypeItem[] {
        let data: ISetWorkloadTypeItem[] = [];
        let imageId: string = "";
        this._showType(KubeResourceType.StatefulSets) && this.state.statefulSetList.forEach((set) => {
            imageId = this._getImageId(set);
            if (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.StatefulSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                imageDisplayText: Utils.getImageText(set.spec.template.spec),
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.currentReplicas,
                payload: set
            });
        });

        this._showType(KubeResourceType.DaemonSets) && this.state.daemonSetList.forEach((set) => {
            imageId = this._getImageId(set);
            if (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.DaemonSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                imageDisplayText: Utils.getImageText(set.spec.template.spec),
                desiredPodCount: set.status.desiredNumberScheduled,
                currentPodCount: set.status.currentNumberScheduled,
                payload: set
            });
        });

        this._showType(KubeResourceType.ReplicaSets) && this.state.replicaSets.forEach((set) => {
            imageId = this._getImageId(set);
            if (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.ReplicaSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                imageDisplayText: Utils.getImageText(set.spec.template.spec),
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.availableReplicas,
                payload: set
            });
        });

        return data;
    }

    private _getImageId(set: V1ReplicaSet | V1DaemonSet | V1StatefulSet): string {
        const podslist = StoreManager.GetStore<PodsStore>(PodsStore).getState().podsList;
        const pods: V1Pod[] = podslist && podslist.items || [];
        return Utils.getImageId(Utils.getFirstImageName(set.spec.template.spec), set.spec.template.metadata, pods);
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

    private _onImageClick = (imageService: IImageService | undefined, imageId: string, itemUid: string): void => {
        // imageService && imageService.getImageDetails(imageId).then(imageDetails => {
        //     if (imageDetails) {
        //         const payload: ISelectionPayload = {
        //             item: imageDetails,
        //             itemUID: itemUid,
        //             showSelectedItem: true,
        //             selectedItemType: SelectedItemKeys.ImageDetailsKey
        //         };
        //         this._selectionActionCreator.selectItem(payload);
        //     }
        // });

        const payload: ISelectionPayload = {
            item: undefined,
            itemUID: itemUid,
            showSelectedItem: true,
            selectedItemType: SelectedItemKeys.ImageDetailsKey
        };
        this._selectionActionCreator.selectItem(payload);
    }

    private _store: WorkloadsStore;
    private _actionCreator: WorkloadsActionsCreator;
    private _selectionActionCreator: SelectionActionsCreator;
    private _imageActionsCreator: ImageDetailsActionsCreator;
    private _imageDetailsStore: ImageDetailsStore;
    private _imageList: string[] = [];
    private _hasImageDetails: { [key: string]: boolean };
}
