import * as React from "react";

import { autobind, BaseComponent, format } from "@uifabric/utilities";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";

import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties, IDeployment } from "../Types";


export interface IDeploymentListComponentProperties extends IVssComponentProperties {
    deployments: IDeployment[];
}

export class DeploymentListComponent extends BaseComponent<IDeploymentListComponentProperties>{
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={"ddl-content"}
                headingText={Resources.DeploymentsDetailsText}
                items={this.props.deployments || []}
                columns={this._getColumns()}
                onRenderItemColumn={this._onRenderItemColumn}
            />
        );
    }

    private _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName = "ddl-col-header";

        columns.push({
            key: deploymentNameKey,
            name: Resources.NameText,
            fieldName: deploymentNameKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: deploymentReplicasKey,
            name: Resources.ReplicasCountText,
            fieldName: deploymentReplicasKey,
            minWidth: 60,
            maxWidth: 60,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: deploymentStrategyKey,
            name: Resources.StrategyText,
            fieldName: deploymentStrategyKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    @autobind
    private _onRenderItemColumn(deployment?: IDeployment, index?: number, column?: IColumn): React.ReactNode {
        if (!deployment || !column) {
            return null;
        }

        let textToRender: string = "";
        switch (column.key) {
            case deploymentNameKey:
                textToRender = deployment.name;
                break;

            case deploymentReplicasKey:
                if (deployment.replicas && deployment.readyReplicas) {
                    textToRender = format("{0} / {1}", deployment.readyReplicas, deployment.replicas);
                }

                break;

            case deploymentStrategyKey:
                textToRender = deployment.strategy;
                break;
        }

        return ListComponent.renderColumn(textToRender, ListComponent.defaultColumnRenderer, "ddl-col-data");
    }
}

const deploymentNameKey = "deployments-list-name-col";
const deploymentReplicasKey = "deployments-list-replicas-col";
const deploymentStrategyKey = "deployments-list-strategy-col";
