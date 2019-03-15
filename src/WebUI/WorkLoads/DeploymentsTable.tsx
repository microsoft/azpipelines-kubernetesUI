/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1DeploymentList, V1ObjectMeta, V1ReplicaSet, V1ReplicaSetList } from "@kubernetes/client-node";
import { BaseComponent, format } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import { defaultColumnRenderer, renderPodsStatusTableCell, renderTableCell } from "../Common/KubeCardWithTable";
import { Tags } from "../Common/Tags";
import { SelectedItemKeys, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { KubeFactory } from "../KubeFactory";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { IDeploymentReplicaSetItem, IDeploymentReplicaSetMap, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./DeploymentsTable.scss";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";

const replicaSetNameKey: string = "replicaSet-col";
const podsKey: string = "pods-col";
const imageKey: string = "image-col";
const ageKey: string = "age-key";

export interface IDeploymentsTableProperties extends IVssComponentProperties {
    kubeService: IKubeService;
    nameFilter?: string;
}

export interface IDeploymentsTableState {
    deploymentList?: V1DeploymentList;
    replicaSetList?: V1ReplicaSetList;
}

export class DeploymentsTable extends BaseComponent<IDeploymentsTableProperties, IDeploymentsTableState> {
    constructor(props: IDeploymentsTableProperties) {
        super(props, {});

        this._workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);
        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        this._store = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        this._workloadsActionCreator.getReplicaSets(this.props.kubeService);

        this.state = { deploymentList: undefined, replicaSetList: undefined };

        this._store.addListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
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
            return this._getDeploymentsListView(filteredDeployments);
        }

        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
    }

    // deployments have already been populated in store by KubeSummary parent component
    private _onReplicaSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            deploymentList: storeState.deploymentList,
            replicaSetList: storeState.replicaSetList
        });
    }

    private _getDeploymentsListView(filteredDeployments: V1Deployment[]): JSX.Element[] {
        let renderList: JSX.Element[] = [];
        DeploymentsTable._generateDeploymentReplicaSetMap(filteredDeployments, this.state.replicaSetList).forEach((entry, index) => {
            const items = DeploymentsTable._getDeploymentReplicaSetItems(entry.deployment, entry.replicaSets);
            const key = format("workloads-deployment-table-{0}", index);
            const deploymentCard = (
                <CustomCard
                    className="deployment-replica-with-pod-list k8s-card-padding flex-grow bolt-card-no-vertical-padding"
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
                    <CardContent contentPadding={false}>
                        <Table
                            id={key}
                            showHeader={true}
                            showLines={true}
                            singleClickActivation={true}
                            itemProvider={new ArrayItemProvider<IDeploymentReplicaSetItem>(items)}
                            pageSize={items.length}
                            columns={DeploymentsTable._getColumns()}
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
            if (replicaSet.spec.replicas > 0) {
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
        const annotations: { [key: string]: string; } = index === 0 ? deployment.metadata.annotations : replica.metadata.annotations;
        const { imageText, imageTooltipText } = Utils.getImageText(replica.spec.template.spec);

        return {
            name: index > 0 ? "" : deployment.metadata.name,
            deploymentId: deployment.metadata.uid,
            replicaSetId: replica.metadata.uid,
            replicaSetName: replica.metadata.name,
            pipeline: Utils.getPipelineText(annotations),
            showRowBorder: (replicaSetLength === (index + 1)),
            deployment: deployment,
            creationTimeStamp: replica.metadata.creationTimestamp,
            kind: replica.kind || "ReplicaSet",
            image: imageText,
            imageTooltip: imageTooltipText,
            // todo :: how to find error in replicaSet
            ...DeploymentsTable._getPodsStatus(replica.status.availableReplicas, replica.status.replicas)
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

    private static _getPodsStatus(availableReplicas: number, replicas: number): { statusProps: IStatusProps | undefined, pods: string } {
        let statusProps: IStatusProps | undefined = undefined;
        let pods = "";
        if (replicas != null && replicas > 0) {
            statusProps = availableReplicas == null
                ? Statuses.Failed
                : availableReplicas < replicas ? Statuses.Running : Statuses.Success;
            pods = localeFormat("{0}/{1}", availableReplicas || 0, replicas);
        }

        return { statusProps: statusProps, pods: pods };
    }


    private static _getColumns(): ITableColumn<IDeploymentReplicaSetItem>[] {
        let columns: ITableColumn<IDeploymentReplicaSetItem>[] = [];
        columns.push({
            id: replicaSetNameKey,
            name: Resources.ReplicaSetText,
            width: 348,
            renderCell: DeploymentsTable._renderReplicaSetNameCell
        });
        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: -72,
            renderCell: DeploymentsTable._renderImageCell
        });
        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 140,
            renderCell: DeploymentsTable._renderPodsCountCell
        });
        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -18,
            renderCell: DeploymentsTable._renderAgeCell
        });

        return columns;
    }

    private static _renderReplicaSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const itemToRender = defaultColumnRenderer(deployment.replicaSetName || "", "fontWeightSemiBold");
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        return renderPodsStatusTableCell(rowIndex, columnIndex, tableColumn, deployment.pods, deployment.statusProps);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const itemToRender = defaultColumnRenderer(deployment.image, undefined, deployment.imageTooltip);
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
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
        if (!this._isTTIMarked) {
            // if previously replicaSet did not exist and is rendered just now
            const prevReplicas = prevState.replicaSetList;
            const currentReplicas = this.state.replicaSetList;
            if ((!prevReplicas || !prevReplicas.items) && (currentReplicas && currentReplicas.items)) {
                KubeFactory.markTTI();
                this._isTTIMarked = true;
            }
        }
    }

    private _isTTIMarked: boolean = false;

    private _store: WorkloadsStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _selectionActionCreator: SelectionActionsCreator;
}
