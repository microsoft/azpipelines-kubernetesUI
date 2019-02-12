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
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import "./ServicesTable.scss";
import { Utils } from "../Utils";
import { IStatusProps, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ResourceStatus } from "../Common/ResourceStatus";
import { ActionsHubManager } from "../FluxCommon/ActionsHubManager";
import { SelectionActions } from "../Selection/SelectionActions";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ServicesEvents, SelectedItemKeys } from "../Constants";
import { ServicesStore } from "./ServicesStore";
import { ServicesActionsCreator } from "./ServicesActionsCreator";

const packageKey: string = "package-col";
const typeKey: string = "type-col";
const clusterIPKey: string = "cluster-ip-col";
const externalIPKey: string = "external-ip-col";
const portKey: string = "port-col";
const ageKey: string = "age-col";
const loadBalancerKey: string = "LoadBalancer";
const colDataClassName: string = "sc-col-data";

export interface IServicesComponentProperties extends IVssComponentProperties {
    typeSelections: string[];
    serviceList: V1ServiceList;
    nameFilter?: string;
}

export class ServicesTable extends BaseComponent<IServicesComponentProperties> {
    public render(): React.ReactNode {
        const filteredSvc: V1Service[] = (this.props.serviceList && this.props.serviceList.items || [])
            .filter((svc) => {
                return this._filterService(svc);
            });

        if (filteredSvc.length > 0) {
            return (
                <div>{
                    <BaseKubeTable
                        className={css("list-content", "depth-16")}
                        items={ServicesTable._getServiceItems(filteredSvc)}
                        columns={ServicesTable._getColumns()}
                        onItemActivated={this._openServiceItem}
                    />
                }
                </div>
            );
        }

        return null;
    }

    private _openServiceItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: IServiceItem) => {
        if (selectedItem) {
            ActionsHubManager.GetActionsHub<SelectionActions>(SelectionActions).selectItem.invoke({ item: selectedItem, showSelectedItem: true, selectedItemType: SelectedItemKeys.ServiceItemKey });
        }
    }

    private static _getServiceItems(serviceList: V1Service[]): IServiceItem[] {
        let items: IServiceItem[] = [];
        serviceList.forEach(service => {
            items.push({
                package: service.metadata.name,
                type: service.spec.type,
                clusterIP: service.spec.clusterIP,
                externalIP: this._getExternalIP(service),
                port: this._getPort(service),
                creationTimestamp: service.metadata.creationTimestamp,
                uid: service.metadata.uid.toLowerCase(),
                pipeline: Utils.getPipelineText(service.metadata.annotations),
                service: service,
                kind: service.kind || "Service"
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

        // Negative widths are interpreted as percentages. Since we want the table columns to occupy full available width, setting width -100 which is equivalent to 100%
        columns.push({
            id: packageKey,
            name: Resources.NameText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: ServicesTable._renderPackageKeyCell
        });

        columns.push({
            id: clusterIPKey,
            name: Resources.ClusterIPText,
            minWidth: 150,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesTable._renderClusterIpCell
        });

        columns.push({
            id: externalIPKey,
            name: Resources.ExternalIPText,
            minWidth: 150,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesTable._renderExternalIpCell
        });

        columns.push({
            id: portKey,
            name: Resources.PortText,
            minWidth: 150,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesTable._renderPortCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 150,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ServicesTable._renderAgeCell
        });

        return columns;
    }

    private static _renderPackageKeyCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = ServicesTable._getServiceStatusWithName(service, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderClusterIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.clusterIP || Resources.NoneText;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderExternalIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.externalIP || Resources.NoneText;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPortCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const textToRender = service.port;
        const itemToRender = BaseKubeTable.renderColumn(textToRender || "", BaseKubeTable.defaultColumnRenderer, colDataClassName);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = (<Ago date={new Date(service.creationTimestamp)} />);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getServiceStatusWithName(service: IServiceItem, cssClassName: string): React.ReactNode {
        let statusProps: IStatusProps = Statuses.Success;
        let tooltipText: string = "";
        if (service.type === loadBalancerKey) {
            tooltipText = Resources.ExternalIPAllocated;
            if (!service.externalIP) {
                tooltipText = Resources.ExternalIPAllocPending;
                statusProps = Statuses.Running;
            }
        }

        return (
            <ResourceStatus
                statusProps={statusProps}
                customDescription={BaseKubeTable.renderTwoLineColumn(service.package, service.type, css(cssClassName, "kube-status-desc"), "primary-text", "secondary-text")}
                toolTipText={tooltipText}
                statusSize={StatusSize.l}
            />
        );
    }

    private _filterService(svc: V1Service): boolean {
        const nameMatches: boolean = Utils.filterByName(svc.metadata.name, this.props.nameFilter);
        const typeMatches: boolean = this.props.typeSelections.length > 0 ? this.props.typeSelections.indexOf(svc.spec.type) >= 0 : true;

        return nameMatches && typeMatches;
    }

    private _store: ServicesStore;
    private _actionCreator: ServicesActionsCreator;
}