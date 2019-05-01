/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1Pod, V1PodSpec, V1ReplicaSet, V1StatefulSet } from "@kubernetes/client-node";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { equals, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { Statuses } from "azure-devops-ui/Status";
import { ITableColumn, Table, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { defaultColumnRenderer, onPodsColumnClicked, renderPodsStatusTableCell, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeSummary } from "../Common/KubeSummary";
import { ImageDetailsEvents, SelectedItemKeys, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetailsActionsCreator } from "../ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { PodsStore } from "../Pods/PodsStore";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { ISetWorkloadTypeItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";

const setNameKey = "otherwrkld-name-key";
const imageKey = "otherwrkld-image-key";
const podsKey = "otherwrkld-pods-key";
const ageKey = "otherwrkld-age-key";

export interface IOtherWorkloadsProperties extends IVssComponentProperties {
    nameFilter?: string;
    typeFilter: string[];
}

export interface IOtherWorkloadsState {
    statefulSets: V1StatefulSet[];
    daemonSets: V1DaemonSet[];
    replicaSets: V1ReplicaSet[];
    orphanPods: V1Pod[];
}

export class OtherWorkloads extends React.Component<IOtherWorkloadsProperties, IOtherWorkloadsState> {
    constructor(props: IOtherWorkloadsProperties) {
        super(props, {});

        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);

        this._actionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        this._imageActionsCreator = ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator);

        this.state = { statefulSets: [], daemonSets: [], replicaSets: [], orphanPods: [] };

        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._store.addListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.addListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.addListener(WorkloadsEvents.WorkloadPodsFetchedEvent, this._onOrphanPodsFetched);

        this._imageDetailsStore.addListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);

        this._actionCreator.getReplicaSets(KubeSummary.getKubeService());
        this._actionCreator.getStatefulSets(KubeSummary.getKubeService());
        this._actionCreator.getDaemonSets(KubeSummary.getKubeService());
    }

    public render(): React.ReactNode {
        const filteredSet: ISetWorkloadTypeItem[] = this._generateRenderData().filter(set => {
            return Utils.filterByName(set.name, this.props.nameFilter);
        });

        if (filteredSet.length > 0) {
            return (
                <CustomCard className="workloads-other-content k8s-card-padding flex-grow bolt-table-card bolt-card-no-vertical-padding">
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
                            columns={this._getColumns()}
                            onActivate={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                                this._showWorkloadDetails(event, tableRow, filteredSet[tableRow.index]);
                            }}
                        />
                    </CardContent>
                </CustomCard>
            );
        }

        return null;
    }

    public componentWillUnmount(): void {
        this._imageDetailsStore.removeListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
        this._store.removeListener(WorkloadsEvents.DaemonSetsFetchedEvent, this._onDaemonSetsFetched);
        this._store.removeListener(WorkloadsEvents.StatefulSetsFetchedEvent, this._onStatefulSetsFetched);
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._store.removeListener(WorkloadsEvents.WorkloadPodsFetchedEvent, this._onOrphanPodsFetched);
    }

    private _onStatefulSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            statefulSets: storeState.statefulSetList && storeState.statefulSetList.items || []
        });
    }

    private _onDaemonSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            daemonSets: storeState.daemonSetList && storeState.daemonSetList.items || []
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

    private _onOrphanPodsFetched = (): void => {
        const storeState = this._store.getState();
        const orphanPods = storeState.orphanPodsList || [];
        this.setState({
            orphanPods: orphanPods
        });
    }

    private _setHasImageDetails = (): void => {
        this.setState({});
    }

    private _showWorkloadDetails = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: ISetWorkloadTypeItem) => {
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
        columns.push({
            id: setNameKey,
            name: Resources.NameText,
            width: new ObservableValue(348),
            renderCell: OtherWorkloads._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: -72,
            renderCell: this._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: new ObservableValue(140),
            renderCell: this._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -28,
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
                        <span className="fontWeightSemiBold font-weight-semibold text-ellipsis">{workload.name}</span>
                    </Tooltip>
                }
                line2={<span className="fontSize font-size secondary-text text-ellipsis">{OtherWorkloads._getSetType(workload.kind)}</span>}
            />
        );
    }

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element => {
        const imageId = workload.imageId;
        const imageText = workload.imageDisplayText || "";
        let imageDetailsUnavailableTooltipText = "";
        const hasImageDetails: boolean | undefined = this._imageDetailsStore.hasImageDetails(imageId);
        // If hasImageDetails is undefined, then image details promise has not resolved, so do not set imageDetailsUnavailable tooltip
        if (hasImageDetails === false) {
            imageDetailsUnavailableTooltipText = localeFormat("{0} | {1}",  workload.imageTooltip || imageText, Resources.ImageDetailsUnavailableText);
        }
        
        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly={true}>
                <Link
                    className="fontSizeM font-size-m text-ellipsis bolt-table-link"
                    excludeTabStop={true}
                    onClick={(e) => {
                        e.preventDefault();
                        this._onImageClick(imageId);
                    }}
                >
                    {imageText}
                </Link>
            </Tooltip> 
            : defaultColumnRenderer(imageText, "", imageDetailsUnavailableTooltipText);

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, "bolt-table-cell-content-with-link");
    }

    private _renderPodsCountCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, workload: ISetWorkloadTypeItem): JSX.Element => {
        let { statusProps, pods, podsTooltip } = Utils.getPodsStatusProps(workload.currentPodCount, workload.desiredPodCount);
        const payload = workload.payload;
        const podslist = StoreManager.GetStore<PodsStore>(PodsStore).getState().podsList;
        const relevantPods = (podslist && podslist.items && podslist.items.filter(p => (payload && Utils.isOwnerMatched(p.metadata, payload.metadata.uid)) || false))

        let type = Utils.getKindFromItemTypeKey(workload.kind as SelectedItemKeys);
        const _onPodsClicked = (relevantPods && payload) ? (() => onPodsColumnClicked(relevantPods, payload, type, this._selectionActionCreator)) : undefined;

        return renderPodsStatusTableCell(rowIndex, columnIndex, tableColumn, pods, statusProps, podsTooltip, _onPodsClicked);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<ISetWorkloadTypeItem>, statefulSet: ISetWorkloadTypeItem): JSX.Element {
        const creationTime = statefulSet.creationTimeStamp ? statefulSet.creationTimeStamp : new Date();
        const itemToRender = <Ago date={new Date(creationTime)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _generateRenderData(): ISetWorkloadTypeItem[] {
        let data: ISetWorkloadTypeItem[] = [];
        let imageId: string = "";
        this._showType(KubeResourceType.StatefulSets) && this.state.statefulSets.forEach(set => {
            imageId = this._getImageId(set.spec.template.spec, set.metadata.uid);
            if (imageId && (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0)) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.StatefulSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.readyReplicas,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        this._showType(KubeResourceType.DaemonSets) && this.state.daemonSets.forEach(set => {
            imageId = this._getImageId(set.spec.template.spec, set.metadata.uid);
            if (imageId && (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0)) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.DaemonSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                desiredPodCount: set.status.desiredNumberScheduled,
                currentPodCount: set.status.numberAvailable,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        this._showType(KubeResourceType.ReplicaSets) && this.state.replicaSets.forEach(set => {
            imageId = this._getImageId(set.spec.template.spec, set.metadata.uid);
            if (imageId && (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0)) {
                this._imageList.push(imageId);
            }

            data.push({
                name: set.metadata.name,
                uid: set.metadata.uid,
                kind: SelectedItemKeys.ReplicaSetKey,
                creationTimeStamp: set.metadata.creationTimestamp,
                imageId: imageId,
                desiredPodCount: set.status.replicas,
                currentPodCount: set.status.readyReplicas,
                payload: set,
                ...OtherWorkloads._getImageText(set.spec.template.spec)
            });
        });

        this._showType(KubeResourceType.Pods) && this.state.orphanPods.forEach(pod => {
            imageId = Utils.getImageIdsForPods([pod])[0] || "";
            if (imageId && (this._imageList.length <= 0 || this._imageList.findIndex(img => equals(img, imageId, true)) < 0)) {
                this._imageList.push(imageId);
            }

            const { statusProps, tooltip } = Utils.generatePodStatusProps(pod.status);
            data.push({
                name: pod.metadata.name,
                uid: pod.metadata.uid,
                kind: SelectedItemKeys.OrphanPodKey,
                creationTimeStamp: pod.metadata.creationTimestamp,
                imageId: imageId,
                desiredPodCount: 1,
                currentPodCount: statusProps === Statuses.Success ? 1 : 0,
                statusProps: statusProps,
                statusTooltip: tooltip,
                payload: pod,
                ...OtherWorkloads._getImageText(pod.spec)
            });
        });

        return data;
    }

    private _getImageId(podSpec: V1PodSpec, uid: string): string {
        const podslist = StoreManager.GetStore<PodsStore>(PodsStore).getState().podsList;
        const pods: V1Pod[] = podslist && podslist.items || [];
        return Utils.getImageIdForWorkload(Utils.getFirstContainerName(podSpec), pods, uid);
    }

    private _showType(type: KubeResourceType): boolean {
        return (this.props.typeFilter.length == 0 || (type != undefined && this.props.typeFilter.indexOf(type.toString()) >= 0));
    }

    private static _getImageText(spec: V1PodSpec): { imageDisplayText: string, imageTooltip?: string } {
        const { imageText, imageTooltipText } = Utils.getImageText(spec);
        return { imageDisplayText: imageText, imageTooltip: imageTooltipText };
    }

    private static _getSetType(selectedItem: string): string {
        switch (selectedItem) {
            case SelectedItemKeys.DaemonSetKey:
                return Resources.DaemonSetText;
            case SelectedItemKeys.ReplicaSetKey:
                return Resources.ReplicaSetText;
            case SelectedItemKeys.StatefulSetKey:
                return Resources.StatefulSetText;
            case SelectedItemKeys.OrphanPodKey:
                return Resources.PodText;
        }

        return "";
    }

    private _onImageClick = (imageId: string, itemUid: string = ""): void => {
        const imageService = KubeSummary.getImageService();
        imageService && imageService.getImageDetails(imageId).then(imageDetails => {
            if (imageDetails) {
                const payload: ISelectionPayload = {
                    item: imageDetails,
                    itemUID: itemUid,
                    showSelectedItem: true,
                    selectedItemType: SelectedItemKeys.ImageDetailsKey
                };
                this._selectionActionCreator.selectItem(payload);
            }
        });
    }

    private _store: WorkloadsStore;
    private _actionCreator: WorkloadsActionsCreator;
    private _selectionActionCreator: SelectionActionsCreator;
    private _imageActionsCreator: ImageDetailsActionsCreator;
    private _imageDetailsStore: ImageDetailsStore;
    private _imageList: string[] = [];
}
