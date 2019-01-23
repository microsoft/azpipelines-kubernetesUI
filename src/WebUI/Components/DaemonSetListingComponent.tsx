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
            renderCell: DaemonSetListingComponent._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            width: 250,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListingComponent._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            width: 80,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListingComponent._renderPodsCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            width: 80,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListingComponent._renderAgeCell
        });

        return columns;
    }

    private static _renderDaemonSetNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const itemToRender = ListComponent.renderTwoLineColumn(daemonSet.metadata.name, Utils.getPipelineText(daemonSet.metadata.annotations), colDataClassName, "primary-text", "secondary-text");
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const textToRender = daemonSet.spec.template.spec.containers[0].image;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (daemonSet.status.desiredNumberScheduled > 0) {
            statusProps = Utils._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
            podString = format("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
        }

        const itemToRender = (
            <PodStatusComponent
                statusProps={statusProps}
                statusDescription={podString}
            />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        const itemToRender = (
            <Ago date={new Date(daemonSet.metadata.creationTimestamp)} />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }
}