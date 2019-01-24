/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Service, V1ServiceList, V1ServicePort } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { ListComponent } from "./ListComponent";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import "./ServicesComponent.scss";
import { Utils } from "../Utils";

const packageKey: string = "package-col";
const typeKey: string = "type-col";
const clusterIPKey: string = "cluster-ip-col";
const externalIPKey: string = "external-ip-col";
const portKey: string = "port-col";
const ageKey: string = "age-col";
const colDataClassName: string = "sc-col-data";

export interface IServicesComponentProperties extends IVssComponentProperties {
    servicesList: V1ServiceList;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, item: IServiceItem) => void;
}

export class ServicesComponent extends BaseComponent<IServicesComponentProperties, {}> {
    public render(): React.ReactNode {

        return (
            <ListComponent
                className={css("list-content", "depth-16")}
                items={ServicesComponent._getServiceItems(this.props.servicesList)}
                columns={ServicesComponent._getColumns()}
                onItemActivated={this._openServiceItem}
            />
        );
    }

    private _openServiceItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: any) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
    }

    private static _getServiceItems(servicesList: V1ServiceList): IServiceItem[] {
        let items: IServiceItem[] = [];

        (servicesList && servicesList.items || []).forEach(service => {
            items.push({
                package: service.metadata.name,
                type: service.spec.type,
                clusterIP: service.spec.clusterIP,
                externalIP: this._getExternalIP(service),
                port: this._getPort(service),
                creationTimestamp: service.metadata.creationTimestamp,
                uid: service.metadata.uid.toLowerCase(),
                pipeline: Utils.getPipelineText(service.metadata.annotations),
                service: service
            });
        });

        return items;
    }

    private static _getExternalIP(service: V1Service): string {
        return service.status
            && service.status.loadBalancer
            && service.status.loadBalancer.ingress
            && service.status.loadBalancer.ingress.length > 0
            && service.status.loadBalancer.ingress[0].ip
            || "";
    }

    private static _getPort(service: V1Service): string {
        if (service.spec
            && service.spec.ports
            && service.spec.ports.length > 0) {
            const ports = service.spec.ports.map(port => this._formatPortString(port));
            return ports.join(", ");
        }

        return "";
    }

    private static _formatPortString(servicePort: V1ServicePort): string {
        const nodePort = servicePort.nodePort ? ":" + servicePort.nodePort : "";
        // example: 80:2080/TCP, if nodeport. 80/TCP, if no nodeport
        return format("{0}{1}/{2}", servicePort.port, nodePort, servicePort.protocol);
    }

    private static _getColumns(): ITableColumn<IServiceItem>[] {
        let columns: ITableColumn<IServiceItem>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = "list-col-content";

        columns.push({
            id: packageKey,
            name: Resources.NameText,
            minWidth: 250,
            width: new ObservableValue(500),
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: ServicesComponent._renderPackageKeyCell
        });

        columns.push({
            id: typeKey,
            name: Resources.TypeText,
            minWidth: 120,
            width: new ObservableValue(240),
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: ServicesComponent._renderTypeCell
        });

        columns.push({
            id: clusterIPKey,
            name: Resources.ClusterIPText,
            minWidth: 150,
            width: new ObservableValue(150),
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesComponent._renderClusterIpCell
        });

        columns.push({
            id: externalIPKey,
            name: Resources.ExternalIPText,
            minWidth: 150,
            width: new ObservableValue(150),
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesComponent._renderExternalIpCell
        });

        columns.push({
            id: portKey,
            name: Resources.PortText,
            minWidth: 150,
            width: new ObservableValue(150),
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesComponent._renderPortCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 150,
            width: new ObservableValue(300),
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesComponent._renderAgeCell
        });

        return columns;
    }

    private static _renderPackageKeyCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = ListComponent.renderTwoLineColumn(service.package, service.pipeline, colDataClassName, "primary-text", "secondary-text");
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderTypeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.type;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderClusterIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.clusterIP || Resources.NoneText;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderExternalIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.externalIP || Resources.NoneText;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPortCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.port;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = (<Ago date={new Date(service.creationTimestamp)} />);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
}