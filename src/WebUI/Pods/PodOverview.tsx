/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format } from "azure-devops-ui/Core/Util/String";
import { Duration } from "azure-devops-ui/Duration";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { Utils } from "../Utils";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { Card } from "azure-devops-ui/Card";
import "./PodOverview.scss";
import { IPodRightPanelProps } from "./PodsRightPanel";
import { TitleSize } from "azure-devops-ui/Header";

export interface IPodOverviewProps extends IPodRightPanelProps { }

export class PodOverview extends BaseComponent<IPodOverviewProps> {
    public render(): JSX.Element {
        const pod: V1Pod = this.props.pod;
        const columns: ITableColumn<any>[] = [
            {
                id: "key",
                name: "key",
                width: new ObservableValue(150),
                className: "pod-overview-key",
                minWidth: 100,
                renderCell: renderSimpleCell
            },
            {
                id: "value",
                name: "value",
                width: new ObservableValue(500),
                className: "pod-overview-value",
                minWidth: 400,
                renderCell: PodOverview._renderValueCell
            },
            ColumnFill
        ];

        const image: string = pod.spec && pod.spec.containers && pod.spec.containers.length > 0 ? pod.spec.containers[0].image : "";
        const tableItems = new ArrayItemProvider<any>([
            { key: Resources.Created, value: pod.metadata.creationTimestamp ? new Date(pod.metadata.creationTimestamp) : new Date().getTime() },
            { key: Resources.AnnotationsText, value: pod.metadata.annotations || {} },
            { key: Resources.RestartPolicyText, value: pod.spec.restartPolicy || "" },
            { key: Resources.QoSClassText, value: pod.status.qosClass || "" },
            { key: Resources.NodeText, value: pod.spec.nodeName || "" },
            { key: Resources.ClusterIPText, value: "" },
            { key: Resources.ImageText, value: image },
            { key: Resources.LabelsText, value: pod.metadata.labels || {} }
        ]);

        return (
            <Card className="kube-list-content s-details depth-16"
                titleProps={{
                text: Resources.PodDetailsHeader,
                size: TitleSize.Large
            }}
contentProps={{ contentPadding: false }}>
                <Table
                    className="s-full-details"
                    id={format("s-full-details-{0}", pod.metadata.uid)}
                    showHeader={false}
                    showLines={false}
                    singleClickActivation={false}
                    itemProvider={tableItems}
                    pageSize={tableItems.length}
                    columns={columns}
                />
            </Card>
        );
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        switch (key) {
            case Resources.Created:
                let props = {
                    columnIndex: columnIndex,
                    children:
                    <span className="pod-details-created-cell">
                        <Duration startDate={value} endDate={new Date()} />
                        {format("{0}", Resources.Ago)}
                    </span>,
                    tableColumn: tableColumn
                };

                return renderTableCell(props);

            case Resources.LabelsText:
                props = {
                    columnIndex: columnIndex,
                    children:
                    <LabelGroup
                        labelProps={Utils.getUILabelModelArray(value)}
                        wrappingBehavior={WrappingBehavior.freeFlow}
                        fadeOutOverflow={true}
                    />,
                    tableColumn: tableColumn
                };

                return renderTableCell(props);

            default:
                return (<div className="kube-simple-cell">
                    {renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem)}
                </div>);
        }
    }
}
