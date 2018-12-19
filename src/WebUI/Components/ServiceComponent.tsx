/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, format, css } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceComponent.scss";
import { V1PodList, V1Pod } from "@kubernetes/client-node";
import { ListComponent } from "./ListComponent";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { Ago } from "azure-devops-ui/Ago";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { StatusSize, Status } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";

export interface IServiceComponentProperties extends IVssComponentProperties {
    service: IServiceItem;
    podListingPromise: Promise<V1PodList>;
}

export interface IServiceComponentState {
    pods:Array<V1Pod>;
}

const podNameKey: string = "svc-pod-name-key";
const podImageKey: string = "svc-pod-image-key";
const podStatusKey: string = "svc-pod-status-key";
const podCreatedTimeKey:string = "svc-pod-age-key";

export class ServiceComponent extends BaseComponent<IServiceComponentProperties, IServiceComponentState> {
    constructor(props: IServiceComponentProperties) {
        super(props, {});
        this.state = {
            pods: []
        };
    }

    public render(): JSX.Element {
        return (
            <div className="service-main-content">
                {this._getMainHeading()}
                {this._getServiceDetails()}
                {this._getAssociatedPods()}
            </div>
        );
    }

    private _getMainHeading(): JSX.Element | null {
        const item = this.props.service;
        if (item) {
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (
                <div className="content-main-heading">
                    <h2 className="title-heading">{item.package}</h2>
                    <div className="sub-heading">
                        {format(Resources.ServiceCreatedText, agoTime)}
                    </div>
                </div>
            );
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const columns = [
                {
                    id: "key",
                    name: "key",
                    width: new ObservableValue(200),
                    className: "s-key",
                    minWidth: 180,
                    renderCell: renderSimpleCell
                },
                {
                    id: "value",
                    name: "value",
                    width: new ObservableValue(500),
                    className: "s-value",
                    minWidth: 400,
                    renderCell: ServiceComponent._renderValueCell
                },
                ColumnFill
            ];
            const tableItems = new ArrayItemProvider<any>([
                { key: Resources.LabelsText, value: item.service.metadata.labels || {} },
                { key: Resources.SelectorText, value: item.service.spec.selector || {} },
                { key: Resources.TypeText, value: item.type },
                { key: Resources.ClusterIPText, value: item.clusterIP },
                { key: Resources.ExternalIPText, value: item.externalIP },
                { key: Resources.PortText, value: item.port },
                { key: Resources.SessionAffinityText, value: item.service.spec.sessionAffinity || "" }
            ]);

            return (
                <div className="kube-list-content s-details depth-16">
                    <h3 className="s-de-heading">{Resources.DetailsText}</h3>
                    <Table
                        className="s-full-details"
                        id={format("s-full-details-{0}", item.uid)}
                        showHeader={false}
                        showLines={false}
                        singleClickActivation={false}
                        itemProvider={tableItems}
                        pageSize={tableItems.getCount()}
                        columns={columns}
                    />
                </div>
            );
        }

        return null;
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        switch (key) {
            case Resources.LabelsText:
            case Resources.SelectorText:
                const props = {
                    columnIndex: columnIndex,
                    children:
                        <LabelGroup
                            labelProps={Utils.getUILabelModelArray(value)}
                            wrappingBehavior={WrappingBehavior.FreeFlow}
                            fadeOutOverflow={true}
                        />,
                    tableColumn: tableColumn
                };

                return renderTableCell(props);

            default:
                return renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem);
        }
    }

    public componentDidMount(): void {
        console.log("getting items");
        this.props.podListingPromise.then(podList => {
            podList &&
            podList.items &&
                this.setState({
                    pods: podList.items
                });
        }).catch(error => {
            console.log(error);
        });
    }

    private _getAssociatedPods(): JSX.Element | null {
        return (
            <ListComponent
                className={css("list-content", "s-details", "depth-16")}
                headingText={Resources.AssociatedPodsText}
                items={this.state.pods}
                columns={ServiceComponent._getPodListColumns()}
                onRenderItemColumn={ServiceComponent._onRenderPodItemColumn}
            />
        );
    }

    private static _getPodListColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "secondary-text";

        columns.push({
            key: podNameKey,
            name: Resources.PodsText,
            fieldName: podNameKey,
            minWidth: 160,
            maxWidth: 160,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });


        columns.push({
            key: podImageKey,
            name: Resources.ImageText,
            fieldName: podImageKey,
            minWidth: 220,
            maxWidth: 220,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podStatusKey,
            name: Resources.StatusText,
            fieldName: podStatusKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podCreatedTimeKey,
            name: Resources.AgeText,
            fieldName: podCreatedTimeKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    private static _onRenderPodItemColumn(pod?: V1Pod, index?: number, column?: IColumn): React.ReactNode {
        if (!pod || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "list-col-content";
        switch (column.key) {
            case podNameKey:
                textToRender = pod.metadata.name;
                colDataClassName = css(colDataClassName, "primary-text");
                break;

            case podImageKey:
                textToRender = pod.spec.containers[0].image;
                break;

            case podStatusKey:
                return (
                    <div className={colDataClassName}>
                        <Status className={colDataClassName} {...Utils.generatePodStatusProps(pod.status)} animated={false} size={StatusSize.m} />        
                        {
                            pod.status.message?
                                <Tooltip showOnFocus={true} text={pod.status.message}>{pod.status.reason}</Tooltip>:
                                <span className="primary-text">{pod.status.phase}</span>
                        }
                    </div>
                );
            case podCreatedTimeKey:
                return(
                    <Ago date={new Date(pod.status.startTime)} />
                );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }

}