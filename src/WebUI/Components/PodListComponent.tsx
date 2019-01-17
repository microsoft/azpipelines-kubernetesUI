/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1ReplicaSet } from "@kubernetes/client-node";
import { autobind, BaseComponent, css, format } from "@uifabric/utilities";
import { Duration } from "azure-devops-ui/Duration";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { ListComponent } from "./ListComponent";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import "./PodListComponent.scss";
import { PodStatusComponent } from "./PodStatusComponent";

const podStatusDic: { [index: string]: IStatusProps } = {
    "Running": Statuses.Success,
    "Pending": Statuses.Waiting,
    "Succeeded": Statuses.Success,
    "Failed": Statuses.Failed,
};

const podStatusKey = "pods-list-status-col";
const podIPKey = "pods-list-ip-col";
const podAgeKey = "pods-list-age-col";

export interface IPodListComponentProperties extends IVssComponentProperties {
    replicaSet: V1ReplicaSet;
    pods: V1Pod[];
}

export class PodListComponent extends BaseComponent<IPodListComponentProperties> {
    public render(): JSX.Element {
        console.log(this.props.pods);
        return (
            <div className="pod-list-content">
                <ListComponent
                    className={css("pdl-content", "depth-16")}
                    headingContent={this._getReplicaSetHeadingContent()}
                    items={this.props.pods}
                    columns={PodListComponent._getColumns()}
                />
            </div>
        );
    }

    private _getReplicaSetHeadingContent(): JSX.Element {
        const replicaSetHeading = format(Resources.ReplicaSet, this.props.replicaSet.metadata.name);

        return (
            <div className={"replica-heading"}>
                <div className="replicaset-name-section">{replicaSetHeading}</div>
                {this._getReplicaSetDescription()}
                {this._getReplicaSetLabels()}
            </div>
        );
    }

    private static _renderPodStatusCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <PodStatusComponent
                    statusProps={podStatusDic[pod.status.phase]}
                    statusDescription={pod.metadata.name}
                />)
            </SimpleTableCell>);
    }

    private static _renderPodIpCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                {ListComponent.renderColumn(pod.status.podIP, ListComponent.defaultColumnRenderer, "pdl-col-data")}
            </SimpleTableCell>);
    }

    private static _renderPodAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element => {
        return (
            <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn} key={"col-" + columnIndex}>
                <Duration startDate={new Date(pod.metadata.creationTimestamp)} endDate={new Date()} />
            </SimpleTableCell>);
    }

    private _getReplicaSetLabels(): React.ReactNode | null {
        const podLabels = this.props.replicaSet.metadata.labels;
        if (podLabels) {
            return (
                <div className="pl-label-group">
                    <LabelGroup
                        labelProps={Utils.getUILabelModelArray(podLabels)}
                        wrappingBehavior={WrappingBehavior.OneLine}
                        fadeOutOverflow={true}
                    />
                </div>
            );
        }

        return null;
    }

    private _getReplicaSetDescription(): JSX.Element | null {
        if (this.props.replicaSet.metadata
            && this.props.replicaSet.metadata.creationTimestamp) {
            let des = "";
            const imageName = this._getImageName();
            if (imageName) {
                des = format(Resources.AgoBy, imageName)
            }

            return (
                <div className="replicaset-description-section sub-heading2">
                    {/* todo :: not good for localization */}
                    <span>{Resources.Created} </span>
                    <Duration startDate={new Date(this.props.replicaSet.metadata.creationTimestamp)} endDate={new Date()} />
                    <span>{des}</span>
                </div>
            );
        }

        return null;
    }

    private _getImageName(): string | null {
        if (this.props.replicaSet.spec
            && this.props.replicaSet.spec.template
            && this.props.replicaSet.spec.template.spec
            && this.props.replicaSet.spec.template.spec.containers
            && this.props.replicaSet.spec.template.spec.containers.length > 0) {
            return this.props.replicaSet.spec.template.spec.containers[0].image;
        }

        return null;
    }

    private static _getColumns(): ITableColumn<V1Pod>[] {
        let columns: ITableColumn<V1Pod>[] = [];
        const headerColumnClassName = "kube-col-header";

        columns.push({
            id: podStatusKey,
            name: Resources.PodsDetailsText,
            width: 250,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodStatusCell(rowIndex, columnIndex, tableColumn, pod),
        });

        columns.push({
            id: podIPKey,
            name: Resources.PodIP,
            width: 250,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodIpCell(rowIndex, columnIndex, tableColumn, pod),
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            width: 200,
            headerClassName: headerColumnClassName,
            renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod) => this._renderPodAgeCell(rowIndex, columnIndex, tableColumn, pod),
        });

        return columns;
    }
}
