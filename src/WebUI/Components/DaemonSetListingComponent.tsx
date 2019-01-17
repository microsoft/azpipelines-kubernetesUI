import { V1DaemonSet, V1DaemonSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Utils } from "../Utils";
import { PodStatusComponent } from "./PodStatusComponent";

const setNameKey = "set-name-key";
const imageKey = "image-key";
const podsKey = "pods-key";
const ageKey = "age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    daemonSetList: V1DaemonSetList;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => void;
}


export class DaemonSetListingComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        return (
            <div>{
                <ListComponent
                    className={css("list-content", "top-padding", "depth-16")}
                    items={this.props.daemonSetList.items || []}
                    columns={DaemonSetListingComponent._getColumns()}
                />
            }</div>
        );
    }

    private static _getColumns(): ITableColumn<V1DaemonSet>[] {
        let columns: ITableColumn<V1DaemonSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.DaemonSetText,
            width: 250,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet) => this._renderSetNameCell(rowIndex, columnIndex, tableColumn, daemonSet),
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: 250,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet) => this._renderImageCell(rowIndex, columnIndex, tableColumn, daemonSet),
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 80,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet) => this._renderPodsCell(rowIndex, columnIndex, tableColumn, daemonSet),
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: 80,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet) => this._renderAgeCell(rowIndex, columnIndex, tableColumn, daemonSet),
        });

        return columns;
    }

    private static _renderSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderTwoLineColumn(daemonSet.metadata.name,
                    Utils.getPipelineText(daemonSet.metadata.annotations),
                    colDataClassName, "primary-text", "secondary-text")}
            </SimpleTableCell>);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const textToRender = daemonSet.spec.template.spec.containers[0].image;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>);
    }

    private static _renderPodsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (daemonSet.status.desiredNumberScheduled > 0) {
            statusProps = Utils._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
            podString = format("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
        }

        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <PodStatusComponent
                    statusProps={statusProps}
                    statusDescription={podString}
                />
            </SimpleTableCell>);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <Ago date={new Date(daemonSet.metadata.creationTimestamp)} />
            </SimpleTableCell>);
    }
}