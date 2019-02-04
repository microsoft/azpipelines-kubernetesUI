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
import { Utils } from "../Utils";
import { ResourceStatusComponent } from "./ResourceStatusComponent";

const setNameKey = "statefulset-name-key";
const imageKey = "statefulset-image-key";
const podsKey = "statefulset-pods-key";
const ageKey = "statefulset-age-key";
const colDataClassName: string = "list-col-content";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    statefulSetList: V1StatefulSetList;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, item: V1StatefulSet) => void;
    nameFilter?: string;
}

export class StatefulSetListComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        const filteredSet: V1StatefulSet[] = (this.props.statefulSetList.items || []).filter((set) => {
            return Utils.filterByName(set.metadata.name, this.props.nameFilter);
        });
        if (filteredSet.length > 0) {
            return (
                <ListComponent
                    className={css("list-content", "top-padding", "depth-16")}
                    items={filteredSet}
                    columns={StatefulSetListComponent._getColumns()}
                    onItemActivated={this._openStatefulSetItem}
                />
            );
        }
        return null;
    }

    private _openStatefulSetItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1StatefulSet) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
    }

    private static _getColumns(): ITableColumn<V1StatefulSet>[] {
        let columns: ITableColumn<V1StatefulSet>[] = [];
        const headerColumnClassName: string = "kube-col-header";

        columns.push({
            id: setNameKey,
            name: Resources.StatefulSetText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            renderCell: StatefulSetListComponent._renderSetNameCell
        });

        columns.push({
            id: imageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListComponent._renderImageCell
        });

        columns.push({
            id: podsKey,
            name: Resources.PodsText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListComponent._renderPodsCountCell
        });

        columns.push({
            id: ageKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            renderCell: StatefulSetListComponent._renderAgeCell
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

    private static _renderPodsCountCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1StatefulSet>, statefulSet: V1StatefulSet): JSX.Element {
        let statusProps: IStatusProps | undefined;
        let podString: string = "";
        if (statefulSet.status.replicas > 0) {
            statusProps = Utils._getPodsStatusProps(statefulSet.status.currentReplicas, statefulSet.status.replicas);
            podString = format("{0}/{1}", statefulSet.status.currentReplicas, statefulSet.status.replicas);
        }

        const itemToRender = (
            <ResourceStatusComponent
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