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
import { IDeploymentItem, IVssComponentProperties, IDeploymentReplicaSetMap } from "../Types";
import "./DeploymentsComponent.scss";
import { ListComponent } from "./ListComponent";
import { ILabelModel, LabelGroup, WrappingBehavior, Label } from "azure-devops-ui/Label";
import { Ago } from "azure-devops-ui/Ago";

const replicaSetNameKey: string = "replicaSet-col";
const pipelineNameKey: string = "pipeline-col";
const podsKey: string = "pods-col";
const imageKey: string = "image-col";
const ageKey: string = "age-key";
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
            <div>{this._getDeploymentListView()}</div>
        );
    }

    private _openDeploymentItem = (item?: any, index?: number, ev?: Event) => {
        if (this.props.onItemInvoked) {
            this.props.onItemInvoked(item, index, ev);
        }
    }

    private _getDeploymentListView() {
        let renderList:JSX.Element[] =[];
        DeploymentsComponent._generateDeploymentReplicaSetMap(this.props.deploymentList, this.props.replicaSetList).forEach(entry => {
           renderList.push( <ListComponent
                className={css("dc-list-content", "depth-16")}
                headingContent={DeploymentsComponent._getHeadingContent(entry.deployment)}
                items={DeploymentsComponent._getDeploymentItems(entry.deployment, entry.replicaSets)}
                columns={DeploymentsComponent._getColumns()}
                onRenderItemColumn={DeploymentsComponent._onRenderItemColumn}
                onItemInvoked={this._openDeploymentItem}
            />);
        }); 
        return renderList;
    }

    private static _generateDeploymentReplicaSetMap(deploymentList: V1DeploymentList, replicaSetList:V1ReplicaSetList):IDeploymentReplicaSetMap[] {
        let deploymentReplicaSetMap:IDeploymentReplicaSetMap[] = [];
        (deploymentList && deploymentList.items || []).forEach(deployment => {
            const filteredReplicas: V1ReplicaSet[] = (replicaSetList && replicaSetList.items || [])
                .filter(replica => DeploymentsComponent._isReplicaSetForDeployment(deployment, replica)) || [];
            filteredReplicas.sort((a, b) => {
                // descending order
                return DeploymentsComponent._getCreationTime(b.metadata) - DeploymentsComponent._getCreationTime(a.metadata);
            });
            deploymentReplicaSetMap.push({
                deployment: deployment,
                replicaSets: filteredReplicas
            });
        });
        return deploymentReplicaSetMap;
    }

    private static _getDeploymentItems(deployment: V1Deployment, replicaSets: V1ReplicaSet[]):
        IDeploymentItem[] {
        let items: IDeploymentItem[] = [];
        replicaSets.forEach((replicaSet, index) => {
                items.push(DeploymentsComponent._getDeploymentItem(deployment, replicaSet, index, replicaSets.length));
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
            deployment: deployment,
            //todo :: how to display images of all containers in a replica pod
            image: replica.spec.template.spec.containers[0].image,
            creationTimeStamp: replica.metadata.creationTimestamp
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
        const columnContentClassname: string = "dc-col-content";
        columns.push({
            key: replicaSetNameKey,
            name: Resources.ReplicaSetText,
            fieldName: replicaSetNameKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });
        columns.push({
            key: imageKey,
            name: Resources.ImageText,
            fieldName: imageKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });

        columns.push({
            key: podsKey,
            name: Resources.PodsText,
            fieldName: podsKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });

        columns.push({
            key: ageKey,
            name: Resources.AgeText,
            fieldName: ageKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
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
            case replicaSetNameKey:
                textToRender = deployment.replicaSetName;
                return ListComponent.renderTwoLineColumn(deployment.replicaSetName||"", deployment.pipeline||"",colDataClassName,"dc-col-primary-text", "dc-col-secondary-text");

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
            case imageKey:
                textToRender = deployment.image;
                break;
            case ageKey:
            return (
                <Ago date={new Date(deployment.creationTimeStamp)} />
            );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }

    private static _generateLabels(labels:{[key:string]:string}): ILabelModel[]{
        let labelModels:ILabelModel[] = [];
        Object.keys(labels).forEach(key => {
            labelModels.push({
                content: format("{0}={1}",key,labels[key])
            });
        });
        return labelModels;
    }
    private static _getHeadingContent( deployment:V1Deployment ): JSX.Element {
        return (
            <div>
                <h3>{deployment.metadata.name}</h3>
                <LabelGroup labelProps={DeploymentsComponent._generateLabels(deployment.metadata.labels)}
                    wrappingBehavior={WrappingBehavior.OneLine}>
                </LabelGroup>
            </div>
        );
    }
}
