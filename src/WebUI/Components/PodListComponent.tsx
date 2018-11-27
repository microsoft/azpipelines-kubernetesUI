import React = require("react");

import { autobind, BaseComponent } from "@uifabric/utilities";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";

import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties, IPod } from "../Types";

export interface IPodListComponentProperties extends IVssComponentProperties {
    pods: IPod[];
}

export class PodListComponent extends BaseComponent<IPodListComponentProperties>{
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={"pdl-content"}
                headingText={Resources.PodsDetailsText}
                items={this.props.pods}
                columns={this._getColumns()}
                onRenderItemColumn={this._onRenderItemColumn}
            />
        );
    }

    private _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName = "pdl-col-header";

        columns.push({
            key: podNameKey,
            name: Resources.NameText,
            fieldName: podNameKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podStatusKey,
            name: Resources.StatusText,
            fieldName: podStatusKey,
            minWidth: 110,
            maxWidth: 110,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podImageKey,
            name: Resources.ImageText,
            fieldName: podImageKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podNodeNameKey,
            name: Resources.NodeNameText,
            fieldName: podNodeNameKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    @autobind
    private _onRenderItemColumn(pod?: IPod, index?: number, column?: IColumn): React.ReactNode {
        if (!pod || !column) {
            return null;
        }

        let textToRender: string = "";
        switch (column.key) {
            case podNameKey:
                textToRender = pod.name;
                break;

            case podStatusKey:
                textToRender = pod.status;
                break;

            case podImageKey:
                textToRender = pod.image;
                break;

            case podNodeNameKey:
                textToRender = pod.nodeName;
                break;
        }

        return ListComponent.renderColumn(textToRender, ListComponent.defaultColumnRenderer, "pdl-col-data");
    }
}

const podNameKey = "pods-list-name-col";
const podStatusKey = "pods-list-status-col";
const podImageKey = "pods-list-image-col";
const podNodeNameKey = "pods-list-node-name-col";
