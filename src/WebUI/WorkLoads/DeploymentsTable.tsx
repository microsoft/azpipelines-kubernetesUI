/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1DeploymentList, V1ObjectMeta, V1ReplicaSet, V1ReplicaSetList } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { Link } from "azure-devops-ui/Link"; 
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { ITableColumn } from "azure-devops-ui/Table";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { ResourceStatus } from "../Common/ResourceStatus";
import { SelectedItemKeys, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import * as Resources from "../Resources";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { IDeploymentReplicaSetItem, IDeploymentReplicaSetMap, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./DeploymentsTable.scss";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";
import { IKubeService } from "../../Contracts/Contracts";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { KubeFactory } from "../KubeFactory";

const replicaSetNameKey: string = "replicaSet-col";
const podsKey: string = "pods-col";
const imageKey: string = "image-col";
const ageKey: string = "age-key";
const colDataClassName: string = "dc-col-data";

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
        const filteredDeployments: V1Deployment[] = (this.state.deploymentList && this.state.deploymentList.items || []).filter((deployment) => {
            return Utils.filterByName(deployment.metadata.name, this.props.nameFilter);
        });

        if (filteredDeployments.length > 0) {
            return (
                <div>{this._getDeploymentListView(filteredDeployments)}</div>
            );
        }

        return null;
    }

    public componentWillUnmount(): void {
        this._store.removeListener(WorkloadsEvents.ReplicaSetsFetchedEvent, this._onReplicaSetsFetched);
    }

    // Deployments have already been populated in store by KubeSummary parent component
    private _onReplicaSetsFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            deploymentList: storeState.deploymentList,
            replicaSetList: storeState.replicaSetList
        });
    }

    private _getDeploymentListView(filteredDeployments: V1Deployment[]) {
        let renderList: JSX.Element[] = [];
        DeploymentsTable._generateDeploymentReplicaSetMap(filteredDeployments, this.state.replicaSetList).forEach((entry, index) => {
            let columnClassName = css("list-content", "depth-16", "replica-with-pod-list", index > 0 ? "" : "first-deployment");
            renderList.push(<BaseKubeTable
                key={format("dep-{0}", index)}
                className={columnClassName}
                headingText={DeploymentsTable._getHeadingContent(entry.deployment)}
                headingDescription={Resources.DeploymentText}
                items={DeploymentsTable._getDeploymentReplicaSetItems(entry.deployment, entry.replicaSets)}
                columns={DeploymentsTable._getColumns()}
                onItemActivated={this._openDeploymentItem}
            />);
        });
        return renderList;
    }

    private static _generateDeploymentReplicaSetMap(deploymentList: V1Deployment[], replicaSetList: V1ReplicaSetList | undefined): IDeploymentReplicaSetMap[] {
        let deploymentReplicaSetMap: IDeploymentReplicaSetMap[] = [];
        deploymentList.forEach(deployment => {
            const filteredReplicas: V1ReplicaSet[] = (replicaSetList && replicaSetList.items || [])
                .filter(replica => DeploymentsTable._isReplicaSetForDeployment(deployment, replica)) || [];
            filteredReplicas.sort((a, b) => {
                // descending order
                return DeploymentsTable._getCreationTime(b.metadata) - DeploymentsTable._getCreationTime(a.metadata);
            });
            deploymentReplicaSetMap.push({
                deployment: deployment,
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
        const annotations: {
            [key: string]: string;
        } = index === 0 ? deployment.metadata.annotations : replica.metadata.annotations;

        return {
            name: index > 0 ? "" : deployment.metadata.name,
            deploymentId: deployment.metadata.uid,
            replicaSetId: replica.metadata.uid,
            replicaSetName: replica.metadata.name,
            pipeline: Utils.getPipelineText(annotations),
            // todo :: how to find error in replicaSet
            pods: DeploymentsTable._getPodsText(replica.status.availableReplicas, replica.status.replicas),
            statusProps: DeploymentsTable._getPodsStatusProps(replica.status.availableReplicas, replica.status.replicas),
            showRowBorder: (replicaSetLength === (index + 1)),
            deployment: deployment,
            image: Utils.getImageText(replica.spec.template.spec),
            creationTimeStamp: replica.metadata.creationTimestamp,
            kind: replica.kind || "ReplicaSet"
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

    private static _getPodsText(availableReplicas: number, replicas: number): string {
        if (replicas != null && availableReplicas != null && replicas > 0) {
            return localeFormat("{0}/{1}", availableReplicas, replicas);
        }

        return "";
    }

    private static _getPodsStatusProps(availableReplicas: number, replicas: number): IStatusProps | undefined {
        if (replicas != null && availableReplicas != null && replicas > 0) {
            return availableReplicas < replicas ? Statuses.Running : Statuses.Success;
        }

        return undefined;
    }


    private static _getColumns(): ITableColumn<IDeploymentReplicaSetItem>[] {
        let columns: ITableColumn<IDeploymentReplicaSetItem>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassname: string = "list-col-content";
        columns.push({
            id: replicaSetNameKey,
            name: Resources.ReplicaSetText,
            width: 348,
            headerClassName: headerColumnClassName,
            className: columnContentClassname,
            renderCell: DeploymentsTable._renderReplicaSetNameCell
        });
        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: -72,
            headerClassName: headerColumnClassName,
            className: columnContentClassname,
            renderCell: DeploymentsTable._renderImageCell
        });
        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 140,
            headerClassName: headerColumnClassName,
            className: columnContentClassname,
            renderCell: DeploymentsTable._renderPodsCountCell
        });
        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -18,
            headerClassName: headerColumnClassName,
            className: columnContentClassname,
            renderCell: DeploymentsTable._renderAgeCell
        });

        return columns;
    }

    private static _renderReplicaSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        return BaseKubeTable.renderTwoLineColumn(columnIndex, tableColumn, deployment.replicaSetName || "", deployment.pipeline || "", css(colDataClassName, "two-lines", "zero-left-padding"), "primary-text", "secondary-text");
    }

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const itemToRender = (
            <Link
                className="fontSizeM text-ellipsis bolt-table-link bolt-table-inline-link"
                excludeTabStop
                href="#"
            >
                <ResourceStatus
                    statusProps={deployment.statusProps}
                    statusDescription={deployment.pods}
                />
            </Link>
        );
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const textToRender: string | undefined = deployment.image;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentReplicaSetItem>, deployment: IDeploymentReplicaSetItem): JSX.Element {
        const textToRender: string | undefined = deployment.image;
        const itemToRender = (<Ago date={new Date(deployment.creationTimeStamp)} />);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getHeadingContent(deployment: V1Deployment): JSX.Element {
        return (
                <span>
                   {deployment.metadata.name}
                    <div className="deployment-heading-labels">
                        {<LabelGroup labelProps={Utils.getUILabelModelArray(deployment.metadata.labels)}
                            wrappingBehavior={WrappingBehavior.oneLine}
                            fadeOutOverflow={true}>
                        </LabelGroup>}
                    </div>
                </span>
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
        if (selectedItem && selectedItem.deploymentId && selectedItem.replicaSetId) {
            const selectedItemDeploymentUId: string = selectedItem.deploymentId.toLowerCase();
            const selectedItemReplicaSetUId: string = selectedItem.replicaSetId.toLowerCase();
            const replicas = this.state.replicaSetList;
            const filteredReplica = (replicas && replicas.items || []).filter(replica => {
                return replica.metadata.uid.toLowerCase() === selectedItemReplicaSetUId;
            });

            return filteredReplica[0];
        }

        return null;
    }

    private _markTTI(prevProps: IDeploymentsTableProperties, prevState: IDeploymentsTableState): void {
        if (!this._isTTIMarked) {
            // if previously replicaSet did not exist and is rendered just now
            if ((!prevState.replicaSetList || !prevState.replicaSetList.items) && 
                (this.state.replicaSetList && this.state.replicaSetList.items)) {
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
