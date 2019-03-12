/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import * as Resources from "../Resources";
import { Utils } from "../Utils";
import "./PodOverview.scss";
import { IPodRightPanelProps } from "./PodsRightPanel";
import { CustomCard, CardContent } from "azure-devops-ui/Card";

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
            },
            ColumnFill
        ];

        const { imageText, imageTooltipText } = Utils.getImageText(pod.spec);

        const tableRows = new ArrayItemProvider<any>([
            { key: Resources.Created, value: pod.metadata.creationTimestamp ? new Date(pod.metadata.creationTimestamp) : new Date().getTime() },
            { key: Resources.AnnotationsText, value: pod.metadata.annotations || "" },
            { key: Resources.RestartPolicyText, value: pod.spec.restartPolicy || "" },
            { key: Resources.QoSClassText, value: pod.status.qosClass || "" },
            { key: Resources.NodeText, value: pod.spec.nodeName || "" },
            { key: Resources.ClusterIPText, value: "" },
            { key: Resources.ImageText, value: imageText, valueTooltipText: imageTooltipText },
            { key: Resources.LabelsText, value: pod.metadata.labels || "" }
        ]);

        return (
            <CustomCard className="pod-overview-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
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

        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
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
                    children: <Ago date={new Date(value)} />,
                    tableColumn: tableColumn,
                    contentClassName: contentClassName
                };

                return renderTableCell(props);

            case Resources.LabelsText:
            case Resources.AnnotationsText:
                props = {
                    columnIndex: columnIndex,
                    children:
                        <LabelGroup
                            labelProps={Utils.getUILabelModelArray(value)}
                            wrappingBehavior={WrappingBehavior.freeFlow}
                        />,
                    tableColumn: tableColumn,
                    contentClassName: css("pod-labels-pill", contentClassName)
                };

                return renderTableCell(props);

            default:
                const itemToRender = BaseKubeTable.defaultColumnRenderer(value, undefined, valueTooltipText);
                return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
        }
    }
}
