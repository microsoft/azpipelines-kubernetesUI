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
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { Ago } from "azure-devops-ui/Ago";
import { Utils } from "../Utils";
import { PodStatusComponent } from "./PodStatusComponent";

const replicaSetNameKey: string = "replicaSet-col";
const podsKey: string = "pods-col";
const imageKey: string = "image-col";
const ageKey: string = "age-key";

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
        DeploymentsComponent._generateDeploymentReplicaSetMap(this.props.deploymentList, this.props.replicaSetList).forEach((entry, index) => {
            let columnClassName = css("list-content", "depth-16", index > 0 ? "replica-with-pod-list" : "");
            renderList.push( <ListComponent
                className={columnClassName}
                headingContent={DeploymentsComponent._getHeadingContent(entry.deployment)}
                items={DeploymentsComponent._getDeploymentReplicaSetItems(entry.deployment, entry.replicaSets)}
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

    private static _getDeploymentReplicaSetItems(deployment: V1Deployment, replicaSets: V1ReplicaSet[]):
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
            pipeline: Utils.getPipelineText(annotations),
            // todo :: how to find error in replicaSet
            pods: DeploymentsComponent._getPodsText(replica.status.availableReplicas, replica.status.replicas),
            statusProps: DeploymentsComponent._getPodsStatusProps(replica.status.availableReplicas, replica.status.replicas),
            showRowBorder: (replicaSetLength === (index + 1)),
            deployment: deployment,
            //todo :: should we show all images of all containers in a replica set?
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


    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassname: string = "list-col-content";
        columns.push({
            key: replicaSetNameKey,
            name: Resources.ReplicaSetText,
            fieldName: replicaSetNameKey,
            minWidth: 250,
            maxWidth: 500,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });
        columns.push({
            key: imageKey,
            name: Resources.ImageText,
            fieldName: imageKey,
            minWidth: 250,
            maxWidth: 500,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });

        columns.push({
            key: podsKey,
            name: Resources.PodsText,
            fieldName: podsKey,
            minWidth: 80,
            maxWidth: 160,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassname
        });

        columns.push({
            key: ageKey,
            name: Resources.AgeText,
            fieldName: ageKey,
            minWidth: 80,
            maxWidth: 160,
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
                return ListComponent.renderTwoLineColumn(deployment.replicaSetName||"", deployment.pipeline||"",colDataClassName,"primary-text", "secondary-text");

            case podsKey:
                return (
                    <PodStatusComponent 
                        statusProps={deployment.statusProps}
                        statusDescription={deployment.pods} 
                    />);
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

    private static _getHeadingContent(deployment: V1Deployment): JSX.Element {
        return (
            <div>
                <h3>{deployment.metadata.name}</h3>
                <div className="kube-flex-row">
                    <span className="secondary-text kind-tag"> {Resources.DeploymentText} </span>
                    <LabelGroup labelProps={Utils.getUILabelModelArray(deployment.metadata.labels)}
                        wrappingBehavior={WrappingBehavior.OneLine}
                        fadeOutOverflow={true}>
                    </LabelGroup>
                </div>
            </div>
        );
    }
}
