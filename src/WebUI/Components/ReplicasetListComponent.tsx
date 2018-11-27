import React = require("react");

import { BaseComponent, autobind, format } from "@uifabric/utilities";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";

import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties, IReplicaset } from "../Types";

export interface IReplicasetListComponentProperties extends IVssComponentProperties {
    replicasets: IReplicaset[];
}

export class ReplicasetListComponent extends BaseComponent<IReplicasetListComponentProperties> {
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={"rdl-content"}
                headingText={Resources.ReplicasetsDetailsText}
                items={this.props.replicasets}
                columns={this._getColumns()}
                onRenderItemColumn={this._onRenderItemColumn}
            />
        );
    }

    private _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName = "rdl-col-header";

        columns.push({
            key: setNameKey,
            name: Resources.NameText,
            fieldName: setNameKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: setPodsKey,
            name: Resources.ReplicasCountText,
            fieldName: setPodsKey,
            minWidth: 110,
            maxWidth: 110,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: setAppNameKey,
            name: Resources.AppNameText,
            fieldName: setAppNameKey,
            minWidth: 150,
            maxWidth: 150,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    @autobind
    private _onRenderItemColumn(replicaset?: IReplicaset, index?: number, column?: IColumn): React.ReactNode {
        if (!replicaset || !column) {
            return null;
        }

        let textToRender: string = "";
        switch (column.key) {
            case setNameKey:
                textToRender = replicaset.name;
                break;

            case setPodsKey:
                if (replicaset.replicas && replicaset.readyReplicas) {
                    textToRender = format("{0} / {1}", replicaset.readyReplicas, replicaset.replicas);
                }

                break;

            case setAppNameKey:
                textToRender = replicaset.appName;
                break;
        }

        return ListComponent.renderColumn(textToRender, ListComponent.defaultColumnRenderer, "rdl-col-data");
    }
}

const setNameKey = "sets-list-name-col";
const setPodsKey = "sets-list-pods-col";
const setAppNameKey = "sets-list-appname-col";
