/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1ReplicaSet } from "@kubernetes/client-node";
import { autobind, BaseComponent, css, format } from "@uifabric/utilities";
import { Duration } from "azure-devops-ui/Duration";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { ListComponent } from "./ListComponent";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import "./PodListComponent.scss";
import { ResourceStatusComponent } from "./ResourceStatusComponent";
import { localeFormat } from "azure-devops-ui/Core/Util/String";

const podStatusDic: { [index: string]: IStatusProps } = {
    "Running": Statuses.Success,
    "Pending": Statuses.Waiting,
    "Succeeded": Statuses.Success,
    "Failed": Statuses.Failed,
};

const podStatusKey = "pods-list-status-col";
const podIPKey = "pods-list-ip-col";
const podAgeKey = "pods-list-age-col";
const colDataClassName: string = "list-col-content";

export interface IPodListComponentProperties extends IVssComponentProperties {
    replicaSet: V1ReplicaSet;
    pods: V1Pod[];
}

export class PodListComponent extends BaseComponent<IPodListComponentProperties> {
    public render(): JSX.Element {
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
        const replicaSetHeading = localeFormat(Resources.ReplicaSet, this.props.replicaSet.metadata.name);

        return (
            <div className={"replica-heading"}>
                <div className="replicaset-name-section">{replicaSetHeading}</div>
                {this._getReplicaSetDescription()}
                {this._getReplicaSetLabels()}
            </div>
        );
    }

    private static _renderPodStatusCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = (
            <ResourceStatusComponent
                statusProps={podStatusDic[pod.status.phase]}
                statusDescription={pod.metadata.name}
            />
        );
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodIpCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = ListComponent.renderColumn(pod.status.podIP, ListComponent.defaultColumnRenderer, "pdl-col-data");
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderPodAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<V1Pod>, pod: V1Pod): JSX.Element {
        const itemToRender = (<Duration startDate={new Date(pod.metadata.creationTimestamp)} endDate={new Date()} />);
        return ListComponent.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
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
            const imageName = Utils.getPodImageName(this.props.replicaSet.spec && this.props.replicaSet.spec.template);
            if (imageName) {
                des = localeFormat(Resources.AgoBy, imageName)
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
            minWidth: 250,
            width: new ObservableValue(250),
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: PodListComponent._renderPodStatusCell
        });

        columns.push({
            id: podIPKey,
            name: Resources.PodIP,
            minWidth: 250,
            width: new ObservableValue(250),
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: PodListComponent._renderPodIpCell
        });

        columns.push({
            id: podAgeKey,
            name: Resources.AgeText,
            minWidth: 200,
            width: new ObservableValue(200),
            headerClassName: headerColumnClassName,
            className: colDataClassName,
            renderCell: PodListComponent._renderPodAgeCell
        });

        return columns;
    }
}
