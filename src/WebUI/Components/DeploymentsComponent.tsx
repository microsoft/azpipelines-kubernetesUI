import "./DeploymentsComponent.scss";

import * as React from "react";
import { IVssComponentProperties } from "../Types";
import { ListComponent } from "./ListComponent";
import * as Resources from "../Resources";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { BaseComponent, format } from "@uifabric/utilities";
import { V1DeploymentList, V1ReplicaSetList, V1Deployment, V1ReplicaSet } from "@kubernetes/client-node";
import { StatusSize, Statuses, Status, IStatusProps } from "azure-devops-ui/Status";

const nameKey: string = "name-col";
const replicaSetNameKey: string = "replicaSet-col";
const pipelineNameKey: string = "pipeline-col";
const podsKey: string = "pods-col";
const azurePipelineNameAnnotationKey: string = "azurepipelinename";
const azurePipelineIdAnnotationKey: string = "azurepipelineid";

interface IDeploymentItem {
    name?: string;
    replicaSetName?: string;
    pipeline?: string;
    pods?: string;
    statusProps?: IStatusProps;
}

export interface IDeploymentsComponentProperties extends IVssComponentProperties {
    deploymentList: V1DeploymentList;
    replicaSetList: V1ReplicaSetList;
}

export class DeploymentsComponent extends BaseComponent<IDeploymentsComponentProperties, {}> {
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={"dc-content"}
                headingText={Resources.DeploymentsDetailsText}
                items={DeploymentsComponent._getDeploymentItems(this.props.deploymentList, this.props.replicaSetList)}
                columns={DeploymentsComponent._getColumns()}
                onRenderItemColumn={DeploymentsComponent._onRenderItemColumn}
            />
        );
    }

    private static _getDeploymentItems(deploymentList: V1DeploymentList, replicaSetList: V1ReplicaSetList):
        IDeploymentItem[] {
        let items: IDeploymentItem[] = [];
        (deploymentList && deploymentList.items || []).forEach(deployment => {
            const filteredReplicas: V1ReplicaSet[] = (replicaSetList && replicaSetList.items || [])
                .filter(replica => DeploymentsComponent._isReplicaSetForDeployment(deployment, replica)) || [];
            filteredReplicas.sort((one, two) => {
                const first: number = (!!one.metadata.creationTimestamp ? new Date(one.metadata.creationTimestamp) : new Date()).getTime();
                const second: number = (!!two.metadata.creationTimestamp ? new Date(two.metadata.creationTimestamp) : new Date()).getTime();
                // descending order
                return second - first;
            });

            filteredReplicas.forEach((replica, index) => {
                // todo :: annotations are taken from deployment for the first replica, rest of the replicas from respective replicas
                const annotations: { [key: string]: string } = index === 0 ? deployment.metadata.annotations : replica.metadata.annotations;
                items.push({
                    name: index > 0 ? "" : deployment.metadata.name,
                    replicaSetName: replica.metadata.name,
                    pipeline: DeploymentsComponent._getPipelineText(annotations),
                    // todo :: how to find error in replicaSet
                    pods: DeploymentsComponent._getPodsText(replica.status.availableReplicas, replica.status.replicas),
                    statusProps: DeploymentsComponent._getPodsStatusProps(replica.status.availableReplicas, replica.status.replicas),
                });
            });
        });

        return items;
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
            if (availableReplicas < replicas) {
                return Statuses.Running;
            }
            else {
                return Statuses.Success;
            }
        }

        return undefined;
    }

    private static _getPipelineText(annotations: { [key: string]: string }): string {
        let pipelineName: string = "", pipelineId: string = "";
        Object.keys(annotations).find(key => {
            if (!pipelineName && key.toLowerCase() === azurePipelineNameAnnotationKey) {
                pipelineName = annotations[key];
            }
            else if (!pipelineId && key.toLowerCase() === azurePipelineIdAnnotationKey) {
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
            headerClassName: headerColumnClassName,
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
        switch (column.key) {
            case nameKey:
                textToRender = deployment.name;
                break;

            case replicaSetNameKey:
                textToRender = deployment.replicaSetName;
                break;

            case pipelineNameKey:
                textToRender = deployment.pipeline;
                break;

            case podsKey:
                return (
                    <div>
                        {
                            !!deployment.statusProps &&
                            /* todo :: change props if needed like size etc */
                            <Status {...deployment.statusProps} animated={false} size={StatusSize.m} />
                        }
                        <span className="deployment-status">{deployment.pods}</span>
                    </div>
                );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, "dc-col-data");
    }
}
