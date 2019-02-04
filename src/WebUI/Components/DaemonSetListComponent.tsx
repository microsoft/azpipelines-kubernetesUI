import { V1DaemonSet, V1DaemonSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { Utils } from "../Utils";
import { ResourceStatusComponent } from "./ResourceStatusComponent";
import { localeFormat } from "azure-devops-ui/Core/Util/String";

const setNameKey = "set-name-key";
const imageKey = "image-key";
const podsKey = "pods-key";
const ageKey = "age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    daemonSetList: V1DaemonSetList;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
    nameFilter?: string;
}


export class DaemonSetListComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        const filteredItems: V1DaemonSet[] = (this.props.daemonSetList.items || []).filter((item) => {
            return Utils.filterByName(item.metadata.name, this.props.nameFilter);
        });
        if (filteredItems.length > 0) {
            return (
                <ListComponent
                    className={css("list-content", "top-padding", "depth-16")}
                    items={this.props.daemonSetList.items || []}
                    columns={DaemonSetListComponent._getColumns()}
                />
            );
        }
        return null;
    }

    private static _getColumns(): ITableColumn<V1DaemonSet>[] {
        let columns: ITableColumn<V1DaemonSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.DaemonSetText,
            minWidth: 250,
            width: new ObservableValue(500),
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderDaemonSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: new ObservableValue(500),
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: new ObservableValue(160),
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: new ObservableValue(160),
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderAgeCell
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

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1DaemonSet>, daemonSet: V1DaemonSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (daemonSet.status.desiredNumberScheduled > 0) {
            statusProps = Utils._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
            podString = localeFormat("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
        }

        const itemToRender = (
            <ResourceStatusComponent
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