/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ColumnFill, ITableColumn, SimpleTableCell as renderSimpleTableCell, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { Tags } from "../Common/Tags";
import * as Resources from "../Resources";
import { Utils } from "../Utils";
import "./PodOverview.scss";
import { IPodRightPanelProps } from "./PodsRightPanel";

export interface IPodOverviewProps extends IPodRightPanelProps { }

export class PodOverview extends BaseComponent<IPodOverviewProps> {
    public render(): JSX.Element {
        const pod: V1Pod = this.props.pod;
        const columns: ITableColumn<any>[] = [
            {
                id: "key",
                name: "key",
                width: new ObservableValue(150),
                className: "pod-overview-key-col",
                minWidth: 100,
                renderCell: PodOverview._renderKeyCell
            },
            {
                id: "value",
                name: "value",
                width: new ObservableValue(500),
                className: "pod-overview-value-col",
                minWidth: 400,
                renderCell: PodOverview._renderValueCell
            }
        ];

        const { imageText, imageTooltipText } = Utils.getImageText(pod.spec);

        const tableRows = new ArrayItemProvider<any>([
            { key: Resources.StatusText, value: localeFormat("{0}{1}", pod.status.phase, !pod.status.reason ? "" : localeFormat(" | {0}", pod.status.reason)) },
            { key: Resources.Created, value: pod.metadata.creationTimestamp ? new Date(pod.metadata.creationTimestamp) : new Date().getTime() },
            { key: Resources.AnnotationsText, value: pod.metadata.annotations || "" },
            { key: Resources.RestartPolicyText, value: pod.spec.restartPolicy || "" },
            { key: Resources.QoSClassText, value: pod.status.qosClass || "" },
            { key: Resources.NodeText, value: pod.spec.nodeName || "" },
            { key: Resources.ClusterIPText, value: "" },
            { key: Resources.ImageText, value: imageText, valueTooltipText: imageTooltipText },
            { key: Resources.LabelsText, value: pod.metadata.labels || "" }
        ]);

        const podErrorMessage = pod.status.message;
        return (
            <>
                {podErrorMessage && <MessageCard severity={MessageCardSeverity.Error}>{pod.status.message}</MessageCard>}
                <div className={podErrorMessage ? "page-content-top" : ""}>
                    <CustomCard className="pod-overview-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                        <CustomHeader>
                            <HeaderTitleArea>
                                <HeaderTitleRow>
                                    <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium}>
                                        {Resources.PodDetailsHeader}
                                    </HeaderTitle>
                                </HeaderTitleRow>
                            </HeaderTitleArea>
                        </CustomHeader>
                        <CardContent contentPadding={false}>
                            <Table
                                id={format("pod-overview-{0}", pod.metadata.uid)}
                                showHeader={false}
                                showLines={false}
                                singleClickActivation={false}
                                itemProvider={tableRows}
                                pageSize={tableRows.length}
                                columns={columns}
                            />
                        </CardContent>
                    </CustomCard>
                </div>
            </>
        );
    }

    private static _renderKeyCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key } = tableItem;
        const contentClassName = "pod-o-k-col-content";

        const itemToRender = (
            <Tooltip text={key} overflowOnly>
                <span className={css("text-ellipsis secondary-text")}>{key}</span>
            </Tooltip>
        );

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value, valueTooltipText } = tableItem;
        let props: any = {};
        const contentClassName = "pod-o-v-col-content";
        switch (key) {
            case Resources.Created:
                props = {
                    columnIndex: columnIndex,
                    children: <Ago date={new Date(value)} format={AgoFormat.Extended} />,
                    tableColumn: tableColumn,
                    contentClassName: contentClassName
                };

                return renderSimpleTableCell(props);

            case Resources.LabelsText:
            case Resources.AnnotationsText:
                props = {
                    columnIndex: columnIndex,
                    children:
                        <Tags items={value} />,
                    tableColumn: tableColumn,
                    contentClassName: css("pod-labels-pill", contentClassName)
                };

                return renderSimpleTableCell(props);

            default:
                const itemToRender = defaultColumnRenderer(value, undefined, valueTooltipText);
                return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
        }
    }
}
