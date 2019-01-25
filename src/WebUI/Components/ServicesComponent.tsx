/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Service, V1ServiceList, V1ServicePort } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { Ago } from "azure-devops-ui/Ago";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { ListComponent } from "./ListComponent";
import "./ServicesComponent.scss";
import { Utils } from "../Utils";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { ResourceStatusComponent } from "./ResourceStatusComponent";

const packageKey: string = "package-col";
const typeKey: string = "type-col";
const clusterIPKey: string = "cluster-ip-col";
const externalIPKey: string = "external-ip-col";
const portKey: string = "port-col";
const ageKey: string = "age-col";
const loadBalancerKey: string = "LoadBalancer";

export interface IServicesComponentProperties extends IVssComponentProperties {
    servicesList: V1ServiceList;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
}

export class ServicesComponent extends BaseComponent<IServicesComponentProperties, {}> {
    public render(): React.ReactNode {

        return (
            <ListComponent
                className={css("list-content", "depth-16")}
                items={ServicesComponent._getServiceItems(this.props.servicesList)}
                columns={ServicesComponent._getColumns()}
                onRenderItemColumn={ServicesComponent._onRenderItemColumn}
                onItemInvoked={this._openServiceItem}
            />
        );
    }

    private _openServiceItem = (item?: any, index?: number, ev?: Event) => {
        if (this.props.onItemInvoked) {
            this.props.onItemInvoked(item, index, ev);
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

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content","two-lines");

        columns.push({
            key: packageKey,
            name: Resources.NameText,
            fieldName: packageKey,
            minWidth: 250,
            maxWidth: 500,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: typeKey,
            name: Resources.TypeText,
            fieldName: typeKey,
            minWidth: 120,
            maxWidth: 240,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: clusterIPKey,
            name: Resources.ClusterIPText,
            fieldName: clusterIPKey,
            minWidth: 150,
            maxWidth: 150,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: externalIPKey,
            name: Resources.ExternalIPText,
            fieldName: externalIPKey,
            minWidth: 150,
            maxWidth: 150,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: portKey,
            name: Resources.PortText,
            fieldName: portKey,
            minWidth: 150,
            maxWidth: 150,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: ageKey,
            name: Resources.AgeText,
            fieldName: ageKey,
            minWidth: 150,
            maxWidth: 300,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        return columns;
    }

    private static _onRenderItemColumn(service?: IServiceItem, index?: number, column?: IColumn): React.ReactNode {
        if (!service || !column) {
            return null;
        }

        const colDataClassName: string = "sc-col-data";
        let textToRender: string = "";
        switch (column.key) {
            case packageKey:
                return ServicesComponent._getServiceStatusWithName(service, colDataClassName);

            case typeKey:
                textToRender = service.type;
                break;

            case clusterIPKey:
                textToRender = service.clusterIP || Resources.NoneText;
                break;

            case externalIPKey:
                textToRender = service.externalIP || Resources.NoneText;
                break;

            case portKey:
                textToRender = service.port;
                break;

            case ageKey:
                return (
                    <Ago date={new Date(service.creationTimestamp)} />
                );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }

    private static _getServiceStatusWithName(service: IServiceItem, cssClassName: string): React.ReactNode {
        let statusProps: IStatusProps = Statuses.Success;
        let tooltipText: string ="";
        if (service.type === loadBalancerKey) {
            tooltipText = Resources.ExternalIPAllocated;
            if (!service.externalIP) {
                tooltipText = Resources.ExternalIPAllocPending;
                statusProps = Statuses.Running;
            }
        }

        return (
            <ResourceStatusComponent
                statusProps={statusProps}
                customDescription={ListComponent.renderTwoLineColumn(service.package, service.pipeline, css(cssClassName, "kube-status-desc"), "primary-text", "secondary-text")}
                toolTipText={tooltipText}
            />
        );
    }
}