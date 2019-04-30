/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1DeploymentList, V1ObjectMeta, V1Pod, V1ReplicaSet, V1ReplicaSetList } from "@kubernetes/client-node";

import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { equals, format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { defaultColumnRenderer, onPodsColumnClicked, renderPodsStatusTableCell, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeSummary } from "../Common/KubeSummary";
import { Tags } from "../Common/Tags";
import { ImageDetailsEvents, SelectedItemKeys, WorkloadsEvents, Scenarios } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { KubeFactory } from "../KubeFactory";
import { PodsStore } from "../Pods/PodsStore";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { IDeploymentReplicaSetItem, IDeploymentReplicaSetMap, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./DeploymentsTable.scss";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";

export interface IDeploymentsTableProperties extends IVssComponentProperties {
    nameFilter?: string;
}

export interface IDeploymentsTableState {
    deploymentList?: V1DeploymentList;
    replicaSetList?: V1ReplicaSetList;
}

export class DeploymentsTable extends React.Component<IDeploymentsTableProperties, IDeploymentsTableState> {
    constructor(props: IDeploymentsTableProperties) {
        super(props, {});

        KubeFactory.telemetryService.scenarioStart(Scenarios.Deployments);
        this._workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this._workloadsActionCreator.getReplicaSets(KubeSummary.getKubeService());

        this.state = { deploymentList: undefined, replicaSetList: undefined };

        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._imageDetailsStore.addListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
    }

    public componentDidUpdate(prevProps: IDeploymentsTableProperties, prevState: IDeploymentsTableState) {
        this._markTTI(prevProps, prevState);
    }

    public render(): React.ReactNode {
        const deployments = this.state.deploymentList;
        const filteredDeployments: V1Deployment[] = (deployments && deployments.items || []).filter((deployment) => {
            return Utils.filterByName(deployment.metadata.name, this.props.nameFilter);
        });

        if (filteredDeployments.length > 0) {
            return this._getDeploymentListView(filteredDeployments);
        }

        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
        this._imageDetailsStore.removeListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
    }

    // deployments have already been populated in store by KubeSummary parent component
    private _onReplicaSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            deploymentList: storeState.deploymentList,
            replicaSetList: storeState.replicaSetList
        });
    }

    private _setHasImageDetails = (): void => {
        this.setState({});
    }

    private _getDeploymentListView(filteredDeployments: V1Deployment[]) {
        let renderList: JSX.Element[] = [];
        DeploymentsTable._generateDeploymentReplicaSetMap(filteredDeployments, this.state.replicaSetList).forEach((entry, index) => {
            const items = DeploymentsTable._getDeploymentReplicaSetItems(entry.deployment, entry.replicaSets);
            const key = format("workloads-d-t-{0}", index);
            const deploymentCard = (
                <CustomCard
                    className="deployment-replica-with-pod-list k8s-card-padding bolt-table-card flex-grow bolt-card-no-vertical-padding"
                    key={key}
                >
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle
                                    className="text-ellipsis"
                                    titleSize={TitleSize.Medium}
                                    children={DeploymentsTable._getHeadingContent(entry.deployment)}
                                />
                            </HeaderTitleRow>
                            <HeaderDescription className="text-ellipsis">{Resources.DeploymentText}</HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className="deployment-replicaset-table" contentPadding={false}>
                        <Table
                            id={key}
                            showHeader={true}
                            showLines={true}
                            singleClickActivation={true}
                            itemProvider={new ArrayItemProvider<IDeploymentReplicaSetItem>(items)}
                            pageSize={items.length}
                            columns={this._getColumns()}
                            onActivate={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                                this._openDeploymentItem(event, tableRow, items[tableRow.index]);
                            }}
                        />
                    </CardContent>
                </CustomCard>
            );

            renderList.push(deploymentCard);
        });

        return renderList;
    }

    private static _generateDeploymentReplicaSetMap(
        deploymentList: V1Deployment[],
        replicaSetList: V1ReplicaSetList | undefined): IDeploymentReplicaSetMap[] {
        let deploymentReplicaSetMap: IDeploymentReplicaSetMap[] = [];
        deploymentList.forEach(d => {
            const replicas = replicaSetList && replicaSetList.items || [];
            const filteredReplicas: V1ReplicaSet[] = replicas.filter(r => DeploymentsTable._isReplicaSetForDeployment(d, r)) || [];
            filteredReplicas.sort((a, b) => {
                // descending order
                return DeploymentsTable._getCreationTime(b.metadata) - DeploymentsTable._getCreationTime(a.metadata);
            });

            deploymentReplicaSetMap.push({
                deployment: d,
                replicaSets: filteredReplicas
            });
        });

        return deploymentReplicaSetMap;
    }

    private static _getDeploymentReplicaSetItems(deployment: V1Deployment, replicaSets: V1ReplicaSet[]):
        IDeploymentReplicaSetItem[] {
        let items: IDeploymentReplicaSetItem[] = [];
        replicaSets.forEach((replicaSet, index) => {
            if (replicaSet && replicaSet.spec && replicaSet.spec.replicas > 0) {
                items.push(DeploymentsTable._getDeploymentReplicaSetItem(deployment, replicaSet, index, replicaSets.length));
            }
        });

        return items;
    }

    private static _getDeploymentReplicaSetItem(
        deployment: V1Deployment,
        replica: V1ReplicaSet,
        index: number,
        replicaSetLength: number): IDeploymentReplicaSetItem {
        // todo :: annotations are taken from deployment for the first replica, rest of the replicas from respective replicas
        const annotations: {
            [key: string]: string;
        } = index === 0 ? deployment.metadata.annotations : replica.metadata.annotations;
        const podslist = StoreManager.GetStore<PodsStore>(PodsStore).getState().podsList;
        const pods: V1Pod[] = podslist && podslist.items || [];
        const imageId = Utils.getImageIdForWorkload(Utils.getFirstContainerName(replica.spec.template.spec), pods, replica.metadata.uid);
        if (imageId && (DeploymentsTable._imageList.length <= 0 || DeploymentsTable._imageList.findIndex(img => equals(img, imageId)) < 0)) {
            DeploymentsTable._imageList.push(imageId);
        }
        const { imageText, imageTooltipText } = Utils.getImageText(replica.spec.template.spec);

        return {
            name: index > 0 ? "" : deployment.metadata.name,
            deploymentId: deployment.metadata.uid,
            replicaSetId: replica.metadata.uid,
            replicaSetName: replica.metadata.name,
            pipeline: Utils.getPipelineText(annotations),
            showRowBorder: (replicaSetLength === (index + 1)),
            deployment: deployment,
            imageDisplayText: imageText,
            imageId: imageId,
            creationTimeStamp: replica.metadata.creationTimestamp,
            kind: replica.kind || "ReplicaSet",
            imageTooltip: imageTooltipText,
            // todo :: how to find error in replicaSet
            ...Utils.getPodsStatusProps(replica.status.readyReplicas, replica.status.replicas)
        };
    }

    private static _getCreationTime(metadata: V1ObjectMeta): number {
        return (!!metadata.creationTimestamp ? new Date(metadata.creationTimestamp) : new Date()).getTime();
    }

    private static _isReplicaSetForDeployment(deployment: V1Deployment, replica: V1ReplicaSet): boolean {
        return !!deployment && !!replica
            && replica.metadata.namespace.toLowerCase() === deployment.metadata.namespace.toLowerCase()
            && replica.metadata.ownerReferences && replica.metadata.ownerReferences.length > 0
            && replica.metadata.ownerReferences[0].uid.toLowerCase() === deployment.metadata.uid.toLowerCase();
    }

    private _getColumns = (): ITableColumn<IDeploymentReplicaSetItem>[] => {
        let columns: ITableColumn<IDeploymentReplicaSetItem>[] = [];
        columns.push({
            id: "replicasetName",
            name: Resources.ReplicaSetText,
            width: new ObservableValue(348),
            renderCell: DeploymentsTable._renderReplicaSetNameCell
        });
        columns.push({
            id: "imageName",
            name: Resources.ImageText,
            width: -72,
            renderCell: this._renderImageCell
        });
        columns.push({
            id: "pods",
            name: Resources.PodsText,
            width: new ObservableValue(140),
            renderCell: this._renderPodsCountCell
        });
        columns.push({
            id: "age",
            name: Resources.AgeText,
            width: -28,
            renderCell: DeploymentsTable._renderAgeCell
        });

        return columns;
    }

    private static _renderReplicaSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const itemToRender = defaultColumnRenderer(deployment.replicaSetName || "", "fontWeightSemiBold font-weight-semibold");
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _renderPodsCountCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element => {
        const replicaSet = this._getSelectedReplicaSet(deployment);
        const podslist = StoreManager.GetStore<PodsStore>(PodsStore).getState().podsList;
        const relevantPods = (podslist && podslist.items && podslist.items.filter(p => (replicaSet && Utils.isOwnerMatched(p.metadata, replicaSet.metadata.uid)) || false))

        const _onPodsClicked = (relevantPods && replicaSet) ? (() => onPodsColumnClicked(relevantPods, replicaSet, "ReplicaSet", this._selectionActionCreator)) : undefined;

        return renderPodsStatusTableCell(rowIndex, columnIndex, tableColumn, deployment.pods, deployment.statusProps, deployment.podsTooltip, _onPodsClicked);
    }

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element => {
        const textToRender: string = deployment.imageDisplayText || "";
        const imageId: string = deployment.imageId;
        let imageDetailsUnavailableTooltipText = "";
        const hasImageDetails: boolean | undefined = this._imageDetailsStore.hasImageDetails(imageId);
        // If hasImageDetails is undefined, then image details promise has not resolved, so do not set imageDetailsUnavailable tooltip
        if (hasImageDetails === false) {
            imageDetailsUnavailableTooltipText = localeFormat("{0} | {1}",  deployment.imageTooltip || textToRender, Resources.ImageDetailsUnavailableText);
        }
        
        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly>
                <Link
                    className="fontSizeM font-size-m text-ellipsis bolt-table-link"
                    rel={"noopener noreferrer"}
                    excludeTabStop
                    onClick={(e) => {
                        e.preventDefault();
                        this._onImageClick(imageId);
                    }}
                >
                    {textToRender}
                </Link>
            </Tooltip >
            : defaultColumnRenderer(textToRender, "", imageDetailsUnavailableTooltipText);

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, hasImageDetails ? "bolt-table-cell-content-with-link" : "");
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const createdDate = deployment.creationTimeStamp ? deployment.creationTimeStamp : new Date();
        const itemToRender = <Ago date={new Date(createdDate)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getHeadingContent(deployment: V1Deployment): JSX.Element {
        return (
            <div className="flex-row flex-center">
                <div>{deployment.metadata.name}</div>
                {/* todo :: body-s is needed as the parent is body-xl */}
                <Tags className="deployment-tbl-heading-labels body-s" items={deployment.metadata.labels} />
            </div>
        );
    }

    private _openDeploymentItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: IDeploymentReplicaSetItem) => {
        const selectedReplicaSet = this._getSelectedReplicaSet(selectedItem);
        if (selectedReplicaSet) {
            const payload: ISelectionPayload = {
                item: selectedReplicaSet,
                itemUID: selectedReplicaSet.metadata.uid,
                showSelectedItem: true,
                selectedItemType: SelectedItemKeys.ReplicaSetKey
            };

            this._selectionActionCreator.selectItem(payload);
        }
    }

    private _getSelectedReplicaSet(selectedItem: IDeploymentReplicaSetItem): V1ReplicaSet | null {
        // have one selection store, raise action to send selectedItem, in the store
        if (selectedItem && selectedItem.replicaSetId) {
            const selectedItemReplicaSetUId: string = selectedItem.replicaSetId.toLowerCase();
            const replicas = this.state.replicaSetList;
            const filteredReplicas = (replicas && replicas.items || []).filter(r => {
                return r.metadata.uid.toLowerCase() === selectedItemReplicaSetUId;
            });

            return filteredReplicas[0];
        }

        return null;
    }

    private _markTTI(prevProps: IDeploymentsTableProperties, prevState: IDeploymentsTableState): void {
        const prevReplicas = prevState.replicaSetList;
        const currentReplicas = this.state.replicaSetList;
        if ((!prevReplicas || !prevReplicas.items) && (currentReplicas && currentReplicas.items)) {
            if (!this._isTTIMarked) {
                // if previously replicaSet did not exist and is rendered just now
                KubeFactory.telemetryService.scenarioEnd(Scenarios.Deployments, { isTTI: true })

                KubeFactory.markTTI();
                this._isTTIMarked = true;
            }
            else {
                KubeFactory.telemetryService.scenarioEnd(Scenarios.Deployments);
            }
        }
    }

    private _onImageClick = (imageId: string): void => {
        const imageService = KubeSummary.getImageService();
        imageService && imageService.getImageDetails(imageId).then(imageDetails => {
            if (imageDetails) {
                const payload: ISelectionPayload = {
                    item: imageDetails,
                    itemUID: "",
                    showSelectedItem: true,
                    selectedItemType: SelectedItemKeys.ImageDetailsKey
                };
                this._selectionActionCreator.selectItem(payload);
            }
        });
    }

    private _isTTIMarked: boolean = false;

    private _store: WorkloadsStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _selectionActionCreator: SelectionActionsCreator;
    private _imageDetailsStore: ImageDetailsStore;
    private static _imageList: string[] = [];
}
