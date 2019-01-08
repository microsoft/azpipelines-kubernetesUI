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
import { ITableRow } from "azure-devops-ui/Components/Table/Table.Props";
import { ResourceStatusComponent } from "./ResourceStatusComponent";

const podNameKey: string = "pl-name-key";
const podImageKey: string = "pl-image-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";
const colDataClassName: string = "list-col-content";

export interface IPodsComponentProperties extends IVssComponentProperties {
    podsToRender:V1Pod[];
    headingText?: string;
    nameFilter?: string;
    onItemActivated?: (event: React.SyntheticEvent<HTMLElement>, item: V1Pod) => void;
}

export class PodsComponent extends BaseComponent<IPodsComponentProperties> {
    public render(): React.ReactNode {
        const filteredPods: V1Pod[] = this.props.podsToRender.filter((pod) => {
            return Utils.filterByName(pod.metadata.name, this.props.nameFilter);
        });
        if (filteredPods.length > 0) {
            return (
                <ListComponent
                    headingText={this.props.headingText}
                    className={css("list-content", "pl-details", "depth-16")}
                    items={this.props.podsToRender}
                    columns={PodsComponent._getColumns()}
                    onItemActivated={this._showPodDetails}
                />
            );
        }
        return null;
    }

    private static _getColumns(): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content");

        columns.push({
            id: podNameKey,
            name: Resources.PodsDetailsText,
            minWidth: 250,
            width: -100,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            className: columnContentClassName,
            renderCell: PodsComponent._renderPodNameCell
        });

        columns.push({
            id: podImageKey,
            name: Resources.ImageText,
            minWidth: 250,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsComponent._renderPodImageCell
        });

        columns.push({
            id: podStatusKey,
            name: Resources.StatusText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsComponent._renderPodStatusCell
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            minWidth: 80,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: PodsComponent._renderPodAgeCell
        });

        return columns;
    }

    private _showPodDetails = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: V1Pod) => {
        if (this.props.onItemActivated) {
            this.props.onItemActivated(event, selectedItem);
        }
    }

    private static _renderPodNameCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.metadata.name;
        let colDataClass = css(colDataClassName, "primary-text");
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClass);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodImageCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const textToRender = pod.spec.containers[0].image;
        const itemToRender = ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodStatusCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        let statusDescription: string = "";
        let customDescription: React.ReactNode = null;

        if (pod.status.message) {
            customDescription = <Tooltip showOnFocus={true} text={pod.status.message}>{pod.status.reason}</Tooltip>;
        }
        else {
            statusDescription = pod.status.phase;
        }

        const itemToRender = (
            <ResourceStatusComponent
                statusProps={Utils.generatePodStatusProps(pod.status)}
                statusDescription={statusDescription}
                customDescription={customDescription}
            />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = (
            <Ago date={new Date(pod.status.startTime)} />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    // private _onPodClicked = (item?: V1Pod, index?: number, ev?: Event) => {
    //     if (this.props.onClicked) {
    //         this.props.onClicked(item ? item.metadata.name : "").then(logs => {
    //             this.podLogs = logs;
    //             this.setState({
    //                 showPodLogs: true
    //             });
    //         });
    //         this.props.podSSHConfig && this.props.podSSHConfig().then(config => {
    //             this.setState({
    //                 termSvc: new TerminalHandler(config, this.termElm)
    //             });
    //             if (item && item.metadata.name && this.state.termSvc) {
    //                 this.state.termSvc.generateTTYForPod(item.metadata.name, item.spec.containers[0].name); // always sshing to first container
    //             }
    //         });
    //     }
    // }
}
