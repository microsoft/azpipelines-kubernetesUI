/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, format } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import "azure-devops-ui/Label.scss";
import { ColumnFill, ITableColumn, renderSimpleCell, Table } from "azure-devops-ui/Table";
import { css } from "azure-devops-ui/Util";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceComponent.scss";

export interface IServiceComponentProperties extends IVssComponentProperties {
    service: IServiceItem;
}

export class ServiceComponent extends BaseComponent<IServiceComponentProperties> {
    public render(): JSX.Element {
        return (
            <div className="service-main-content">
                {this._getMainHeading()}
                {this._getServiceDetails()}
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

                return ServiceComponent._simpleTableCell(props);

            default:
                return renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem);
        }
    }

    // todo :: remove this function once azure-devops-ui expose this function
    private static _simpleTableCell(
        props: { columnIndex: number; children: React.ReactNode; tableColumn: ITableColumn<any>; className?: string }): JSX.Element {
        const { className, columnIndex } = props;
        return (
            <td
                key={"col-" + columnIndex}
                aria-colindex={columnIndex}
                className={css(className, props.tableColumn.className, "bolt-table-cell bolt-list-cell")}
                data-column-index={columnIndex}
            >
                {props.children}
            </td>
        );
    }
}