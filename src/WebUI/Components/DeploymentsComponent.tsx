/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1DeploymentList, V1ObjectMeta, V1ReplicaSet, V1ReplicaSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { IDeploymentItem, IVssComponentProperties } from "../Types";
import "./DeploymentsComponent.scss";
import { ListComponent } from "./ListComponent";

const nameKey: string = "name-col";
const replicaSetNameKey: string = "replicaSet-col";
const pipelineNameKey: string = "pipeline-col";
const podsKey: string = "pods-col";
const pipelineNameAnnotationKey: string = "pipeline-name";
const pipelineIdAnnotationKey: string = "pipeline-id";

export interface IDeploymentsComponentProperties extends IVssComponentProperties {
    deploymentList: V1DeploymentList;
    replicaSetList: V1ReplicaSetList;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
}

export class DeploymentsComponent extends BaseComponent<IDeploymentsComponentProperties, {}> {
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={css("dc-list-content", "depth-16")}
                headingText={Resources.DeploymentsDetailsText}
                items={DeploymentsComponent._getDeploymentItems(this.props.deploymentList, this.props.replicaSetList)}
                columns={DeploymentsComponent._getColumns()}
                onRenderItemColumn={DeploymentsComponent._onRenderItemColumn}
                onItemInvoked={this._openDeploymentItem}
            />
        );
    }

    private _openDeploymentItem = (item?: any, index?: number, ev?: Event) => {
        if (this.props.onItemInvoked) {
            this.props.onItemInvoked(item, index, ev);
        }
    }

    private static _getDeploymentItems(deploymentList: V1DeploymentList, replicaSetList: V1ReplicaSetList):
        IDeploymentItem[] {
        let items: IDeploymentItem[] = [];
        (deploymentList && deploymentList.items || []).forEach(deployment => {
            const filteredReplicas: V1ReplicaSet[] = (replicaSetList && replicaSetList.items || [])
                .filter(replica => DeploymentsComponent._isReplicaSetForDeployment(deployment, replica)) || [];
            filteredReplicas.sort((a, b) => {
                // descending order
                return DeploymentsComponent._getCreationTime(b.metadata) - DeploymentsComponent._getCreationTime(a.metadata);
            });

            filteredReplicas.forEach((replica, index) => {
                items.push(DeploymentsComponent._getDeploymentItem(deployment, replica, index, filteredReplicas.length));
            });
        });

        return items;
    }

    private static _getDeploymentItem(
        deployment: V1Deployment,
        replica: V1ReplicaSet,
        index: number,
        replicaSetLength: number): IDeploymentItem {
        // todo :: annotations are taken from deployment for the first replica, rest of the replicas from respective replicas
        const annotations: {
            [key: string]: string;
        } = index === 0 ? deployment.metadata.annotations : replica.metadata.annotations;

        return {
            name: index > 0 ? "" : deployment.metadata.name,
            uid: deployment.metadata.uid,
            replicaSetName: replica.metadata.name,
            pipeline: DeploymentsComponent._getPipelineText(annotations),
            // todo :: how to find error in replicaSet
            pods: DeploymentsComponent._getPodsText(replica.status.availableReplicas, replica.status.replicas),
            statusProps: DeploymentsComponent._getPodsStatusProps(replica.status.availableReplicas, replica.status.replicas),
            showRowBorder: (replicaSetLength === (index + 1)),
            deployment: deployment
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
            return format("{0}/{1}", availableReplicas, replicas);
        }

        return "";
    }

    private static _getPodsStatusProps(availableReplicas: number, replicas: number): IStatusProps | undefined {
        if (replicas != null && availableReplicas != null && replicas > 0) {
            return availableReplicas < replicas ? Statuses.Running : Statuses.Success;
        }

        return undefined;
    }

    private static _getPipelineText(annotations: { [key: string]: string }): string {
        let pipelineName: string = "", pipelineId: string = "";
        Object.keys(annotations).find(key => {
            if (!pipelineName && key.toLowerCase() === pipelineNameAnnotationKey) {
                pipelineName = annotations[key];
            }
            else if (!pipelineId && key.toLowerCase() === pipelineIdAnnotationKey) {
                pipelineId = annotations[key];
            }

            return !!pipelineName && !!pipelineId;
        });

        return pipelineName && pipelineId ? format("{0} / {1}", pipelineName, pipelineId) : "";
    }

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "dc-col-header";

        columns.push({
            key: nameKey,
            name: Resources.NameText,
            fieldName: nameKey,
            minWidth: 140,
            maxWidth: 140,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: replicaSetNameKey,
            name: Resources.ReplicaSetText,
            fieldName: replicaSetNameKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: pipelineNameKey,
            name: Resources.PipelineText,
            fieldName: pipelineNameKey,
            minWidth: 220,
            maxWidth: 220,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podsKey,
            name: Resources.PodsText,
            fieldName: podsKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    private static _onRenderItemColumn(deployment?: IDeploymentItem, index?: number, column?: IColumn): React.ReactNode {
        if (!deployment || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "dc-col-data";
        switch (column.key) {
            case nameKey:
                textToRender = deployment.name;
                colDataClassName = css(colDataClassName, "first-col-data");
                break;

            case replicaSetNameKey:
                textToRender = deployment.replicaSetName;
                break;

            case pipelineNameKey:
                textToRender = deployment.pipeline;
                break;

            case podsKey:
                return (
                    <div className={colDataClassName}>
                        {
                            !!deployment.statusProps &&
                            /* todo :: change props if needed like size etc */
                            <Status {...deployment.statusProps} animated={false} size={StatusSize.m} />
                        }
                        <span className="deployment-status">{deployment.pods}</span>
                    </div>
                );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }
}
