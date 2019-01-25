import { V1StatefulSet, V1StatefulSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Utils } from "../Utils";
import { PodStatusComponent } from "./PodStatusComponent";

const setNameKey = "statefulset-name-key";
const imageKey = "statefulset-image-key";
const podsKey = "statefulset-pods-key";
const ageKey = "statefulset-age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    statefulSetList: V1StatefulSetList;
}

export class StatefulSetListingComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        return (
            <div>{
                <ListComponent
                    className={css("list-content", "top-padding", "depth-16")}
                    items={this.props.statefulSetList.items || []}
                    columns={StatefulSetListingComponent._getColumns()}
                />
            }</div>
        );
    }

    private static _getColumns(): ITableColumn<V1StatefulSet>[] {
        let columns: ITableColumn<V1StatefulSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.StatefulSetText,
            minWidth: 250,
            width: new ObservableValue(500),
            headerClassName: css(headerColumnClassName, "first-col-header"),
            renderCell: StatefulSetListingComponent._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: new ObservableValue(500),
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListingComponent._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: new ObservableValue(160),
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListingComponent._renderPodsCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: new ObservableValue(160),
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListingComponent._renderAgeCell
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const itemToRender = ListComponent.renderTwoLineColumn(statefulSet.metadata.name, Utils.getPipelineText(statefulSet.metadata.annotations), colDataClassName, "primary-text", "secondary-text");
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const textToRender = statefulSet.spec.template.spec.containers[0].image;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (statefulSet.status.replicas > 0) {
            statusProps = Utils._getPodsStatusProps(statefulSet.status.currentReplicas, statefulSet.status.replicas);
            podString = format("{0}/{1}", statefulSet.status.currentReplicas, statefulSet.status.replicas);
        }

        const itemToRender = (
            <PodStatusComponent
                statusProps={statusProps}
                statusDescription={podString}
            />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        const itemToRender = (<Ago date={new Date(statefulSet.metadata.creationTimestamp)} />);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
}