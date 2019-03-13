/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Service, V1ServiceList, V1ServicePort } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { Card } from "azure-devops-ui/Card";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, Table, TwoLineTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { SelectedItemKeys } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";

const packageKey: string = "package-col";
const clusterIPKey: string = "cluster-ip-col";
const externalIPKey: string = "external-ip-col";
const portKey: string = "port-col";
const ageKey: string = "age-col";
const loadBalancerKey: string = "LoadBalancer";

export interface IServicesComponentProperties extends IVssComponentProperties {
    typeSelections: string[];
    serviceList: V1ServiceList;
    nameFilter?: string;
}

export class ServicesTable extends BaseComponent<IServicesComponentProperties> {
    constructor(props: IServicesComponentProperties) {
        super(props, {});

        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
    }

    public render(): React.ReactNode {
        const filteredSvc: V1Service[] = (this.props.serviceList && this.props.serviceList.items || [])
            .filter((svc) => {
                return this._filterService(svc);
            });

        if (filteredSvc.length > 0) {
            const serviceItems = ServicesTable.getServiceItems(filteredSvc);
            return (
                <Card className="services-list-card flex-grow bolt-card-no-vertical-padding"
                    contentProps={{ contentPadding: false }}>
                    <Table
                        id="services-list-table"
                        showHeader={true}
                        showLines={true}
                        singleClickActivation={true}
                        itemProvider={new ArrayItemProvider<IServiceItem>(serviceItems)}
                        pageSize={filteredSvc.length}
                        columns={ServicesTable._getColumns()}
                        onActivate={(event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                            this._openServiceItem(event, tableRow, serviceItems[tableRow.index]);
                        }}
                    />
                </Card>
            );
        } else {
            return KubeZeroData.getNoResultsZeroData();
        }
    }

    public static getServiceItems(serviceList: V1Service[]): IServiceItem[] {
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

    private _openServiceItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: IServiceItem) => {
        if (selectedItem) {
            const payload: ISelectionPayload = { 
                item: selectedItem, 
                itemUID: (selectedItem.service as V1Service).metadata.uid,
                showSelectedItem: true, 
                selectedItemType: SelectedItemKeys.ServiceItemKey 
            };

            this._selectionActionCreator.selectItem(payload);
        }
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
        return localeFormat("{0}{1}/{2}", servicePort.port, nodePort, servicePort.protocol);
    }

    private static _getColumns(): ITableColumn<IServiceItem>[] {
        let columns: ITableColumn<IServiceItem>[] = [];

        // negative widths are interpreted as percentages.
        // since we want the table columns to occupy full available width, setting width - 100 which is equivalent to 100 %
        columns.push({
            id: packageKey,
            name: Resources.NameText,
            width: -70,
            renderCell: ServicesTable._renderPackageKeyCell
        });

        columns.push({
            id: clusterIPKey,
            name: Resources.ClusterIPText,
            width: -15,
            renderCell: ServicesTable._renderClusterIpCell
        });

        columns.push({
            id: externalIPKey,
            name: Resources.ExternalIPText,
            width: 172,
            renderCell: ServicesTable._renderExternalIpCell
        });

        columns.push({
            id: portKey,
            name: Resources.PortText,
            width: 200,
            renderCell: ServicesTable._renderPortCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: -15,
            renderCell: ServicesTable._renderAgeCell
        });

        return columns;
    }

    private static _renderPackageKeyCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return ServicesTable._getServiceStatusWithName(service, columnIndex, tableColumn);
    }

    private static _renderClusterIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return ServicesTable._renderTextCell(rowIndex, columnIndex, tableColumn, service.clusterIP, Resources.NoneText);
    }

    private static _renderExternalIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return ServicesTable._renderTextCell(rowIndex, columnIndex, tableColumn, service.externalIP, Resources.NoneText);
    }

    private static _renderPortCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return ServicesTable._renderTextCell(rowIndex, columnIndex, tableColumn, service.port, "");
    }

    private static _renderTextCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, text: string, defaultText: string): JSX.Element => {
        const itemToRender = BaseKubeTable.renderColumn(text || defaultText || "", BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = <Ago date={new Date(service.creationTimestamp)} />;
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getServiceStatusWithName(service: IServiceItem, columnIndex: number, tableColumn: ITableColumn<IServiceItem>): JSX.Element{
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
            <TwoLineTableCell
                key={"col-" + columnIndex}
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                line1={
                    <Tooltip overflowOnly={true} text={service.package}>
                        <span className="fontWeightSemiBold text-ellipsis">{service.package}</span>
                    </Tooltip>
                }
                line2={
                    <span className="fontSize secondary-text text-ellipsis">{service.type}</span>
                }
                iconProps={{
                    render: (className?: string) => {
                        return (
                            <Tooltip text={tooltipText}>
                                <span className="flex-row">
                                    <Status {...statusProps} className="icon-large-margin" size={StatusSize.l} />
                                </span>
                            </Tooltip>
                        );
                    }
                }}
            />
        );
    }

    private _filterService(svc: V1Service): boolean {
        const nameMatches: boolean = Utils.filterByName(svc.metadata.name, this.props.nameFilter);
        const typeMatches: boolean = this.props.typeSelections.length > 0 ? this.props.typeSelections.indexOf(svc.spec.type) >= 0 : true;

        return nameMatches && typeMatches;
    }

    private _selectionActionCreator: SelectionActionsCreator;
}