import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import "./PodsComponent.scss";
import { V1Pod } from "@kubernetes/client-node";
import { Utils } from "../Utils";
import { StatusSize, Status } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { PodStatusComponent } from "./PodStatusComponent";

const podNameKey: string = "pl-name-key";
const podImageKey: string = "pl-image-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const colDataClassName: string = "list-col-content";

export interface IPodsComponentProperties extends IVssComponentProperties {
    podsToRender: V1Pod[];
    headingText?: string;
}

export class PodsComponent extends BaseComponent<IPodsComponentProperties> {
    public render(): React.ReactNode {

        return (
            <ListComponent
                headingText={this.props.headingText}
                className={css("list-content", "pl-details", "depth-16")}
                items={this.props.podsToRender}
                columns={PodsComponent._getColumns()}
            />
        );
    }

    private static _getColumns(): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content");

        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            width: 250,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodNameCell(rowIndex, columnIndex, tableColumn, pod),
        });

        columns.push({
            id: podImageKey,
            name: Resources.ImageText,
            width: 250,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodImageCell(rowIndex, columnIndex, tableColumn, pod),
        });

        columns.push({
            id: podStatusKey,
            name: Resources.StatusText,
            width: 80,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodStatusCell(rowIndex, columnIndex, tableColumn, pod),
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            width: 80,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodAgeCell(rowIndex, columnIndex, tableColumn, pod),
        });

        return columns;
    }

    private static _renderPodNameCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        const textToRender = pod.metadata.name;
        let colDataClass = css(colDataClassName, "primary-text");
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClass)}
            </SimpleTableCell>
        );
    }

    private static _renderPodImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        const textToRender = pod.spec.containers[0].image;
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName)}
            </SimpleTableCell>
        );
    }

    private static _renderPodStatusCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        let statusDescription: string = "";
        let customDescription: React.ReactNode = null;

        if (pod.status.message) {
            customDescription = <Tooltip showOnFocus={true} text={pod.status.message}>{pod.status.reason}</Tooltip>;
        }
        else {
            statusDescription = pod.status.phase;
        }
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <PodStatusComponent
                    statusProps={Utils.generatePodStatusProps(pod.status)}
                    statusDescription={statusDescription}
                    customDescription={customDescription}
                />
            </SimpleTableCell>
        );
    }

    private static _renderPodAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <Ago date={new Date(pod.status.startTime)} />
            </SimpleTableCell>
        );
    }
}
