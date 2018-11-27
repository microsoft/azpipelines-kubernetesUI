import React = require("react");

import { autobind, BaseComponent } from "@uifabric/utilities";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";

import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties, IService } from "../Types";

export interface IServiceListComponentProperties extends IVssComponentProperties {
    services: IService[];
}

export class ServiceListComponent extends BaseComponent<IServiceListComponentProperties>{
    public render(): React.ReactNode {
        return (
            <ListComponent
                className={"sdl-content"}
                headingText={Resources.ServicesDetailsText}
                items={this.props.services}
                columns={this._getColumns()}
                onRenderItemColumn={this._onRenderItemColumn}
            />
        );
    }

    private _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName = "sdl-col-header";

        columns.push({
            key: serviceNameKey,
            name: Resources.NameText,
            fieldName: serviceNameKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: serviceTypeKey,
            name: Resources.TypeText,
            fieldName: serviceTypeKey,
            minWidth: 110,
            maxWidth: 110,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: serviceClusterIpKey,
            name: Resources.ClusterIPText,
            fieldName: serviceClusterIpKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });
        columns.push({
            key: serviceExternalIpKey,
            name: Resources.ExternalIPText,
            fieldName: serviceExternalIpKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    @autobind
    private _onRenderItemColumn(service?: IService, index?: number, column?: IColumn): React.ReactNode {
        if (!service || !column) {
            return null;
        }

        let textToRender: string = "";
        switch (column.key) {
            case serviceNameKey:
                textToRender = service.name;
                break;

            case serviceTypeKey:
                textToRender = service.type;
                break;

            case serviceClusterIpKey:
                textToRender = service.clusterIP;
                break;

            case serviceExternalIpKey:
                textToRender = service.externalIP;
                break;
        }

        return ListComponent.renderColumn(textToRender, ListComponent.defaultColumnRenderer, "sdl-col-data");
    }
}

const serviceNameKey = "services-list-name-col";
const serviceTypeKey = "services-list-type-col";
const serviceClusterIpKey = "services-list-cluster-ip-col";
const serviceExternalIpKey = "services-list-external-ip-col";
