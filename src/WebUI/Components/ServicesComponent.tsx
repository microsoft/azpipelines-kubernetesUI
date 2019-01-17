/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Service, V1ServiceList, V1ServicePort } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
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
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => void;
}

export class ServicesComponent extends BaseComponent<IServicesComponentProperties, {}> {
    public render(): React.ReactNode {

        return (
            <ListComponent
                className={css("list-content", "depth-16")}
                items={ServicesComponent.getServiceItems(this.props.servicesList)}
                columns={ServicesComponent._getColumns()}
                onItemActivated={this._openServiceItem}
            />
        );
    }

    private _openServiceItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, tableRow);
        }
    }

    public static getServiceItems(servicesList: V1ServiceList): IServiceItem[] {
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
            width: 250,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem) => this._renderPackageKeyCell(rowIndex, columnIndex, tableColumn, service)
        });

        columns.push({
            id: typeKey,
            name: Resources.TypeText,
            width: 120,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName
        });

        columns.push({
            id: clusterIPKey,
            name: Resources.ClusterIPText,
            width: 150,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem) => this._renderClusterIpCell(rowIndex, columnIndex, tableColumn, service)
        });

        columns.push({
            id: externalIPKey,
            name: Resources.ExternalIPText,
            width: 150,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem) => this._renderExternalIpCell(rowIndex, columnIndex, tableColumn, service)
        });

        columns.push({
            id: portKey,
            name: Resources.PortText,
            width: 150,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem) => this._renderPortCell(rowIndex, columnIndex, tableColumn, service)
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: 150,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem) => this._renderAgeCell(rowIndex, columnIndex, tableColumn, service)
        });

        return columns;
    }

    private static _renderPackageKeyCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderTwoLineColumn(service.package, service.pipeline, colDataClassName, "primary-text", "secondary-text")}
            </SimpleTableCell>
        );
    }

    private static _renderTypeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.type;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>
        );
    }

    private static _renderClusterIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.clusterIP || Resources.NoneText;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>
        );
    }

    private static _renderExternalIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.externalIP || Resources.NoneText;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>
        );
    }

    private static _renderPortCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.port;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>
        );
    }

    private static _renderAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <Ago date={new Date(service.creationTimestamp)} />
            </SimpleTableCell>
        );
    }
}