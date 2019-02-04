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
import { ResourceStatusComponent } from "./ResourceStatusComponent";

const setNameKey = "set-name-key";
const imageKey = "image-key";
const podsKey = "pods-key";
const ageKey = "age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    daemonSetList: V1DaemonSetList;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, item: V1DaemonSet) => void;
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
                    onItemActivated={this._openDaemonSetItem}
                />
            );
        }
        return null;
    }

    private _openDaemonSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1DaemonSet) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
    }

    private static _getColumns(): ITableColumn<V1DaemonSet>[] {
        let columns: ITableColumn<V1DaemonSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.DaemonSetText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderDaemonSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: DaemonSetListComponent._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
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
            podString = format("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
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