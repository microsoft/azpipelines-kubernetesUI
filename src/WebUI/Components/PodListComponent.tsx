import "azure-devops-ui/Label.scss";
import "./PodListComponent.scss";

import { IVssComponentProperties } from "../Types";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import React = require("react");
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { autobind, BaseComponent, format } from "@uifabric/utilities";
import { ObservableArray } from "azure-devops-ui/Core/Observable";
import { V1Pod, V1ReplicaSet } from "@kubernetes/client-node";
import { Duration } from "azure-devops-ui/Duration";
import { ILabelModel, LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { Status, Statuses, StatusSize, IStatusProps } from "azure-devops-ui/Status";

export interface IPodListComponentProperties extends IVssComponentProperties {
    replicaSet: V1ReplicaSet;
    pods: V1Pod[];
}

export class PodListComponent extends BaseComponent<IPodListComponentProperties>{
    public render(): JSX.Element {
        return (
            <div>
                <ListComponent
                    className={"pdl-content"}
                    headingContent={this._getReplicaSetHeadingContent()}
                    items={this.props.pods}
                    columns={this._getColumns()}
                    onRenderItemColumn={this._onRenderItemColumn}
                />
            </div>
        );
    }

    private _getReplicaSetHeadingContent(): JSX.Element {
        let replicaSetHeading = format(Resources.ReplicaSet, this.props.replicaSet.metadata.name);

        return (
            <div className={"replica-heading"}>
                <div className="replicaset-name-section">{replicaSetHeading}</div>
                {this._getReplicaSetDescription()}
                {this._getReplicaSetLabels()}
            </div>
        );
    }

    private _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName = "pdl-col-header";

        columns.push({
            key: podStatusKey,
            name: Resources.PodsDetailsText,
            fieldName: podStatusKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podIPKey,
            name: Resources.PodIP,
            fieldName: podIPKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podAgeKey,
            name: Resources.PodAge,
            fieldName: podAgeKey,
            minWidth: 200,
            maxWidth: 200,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        return columns;
    }

    @autobind
    private _onRenderItemColumn(pod?: V1Pod, index?: number, column?: IColumn): React.ReactNode {
        if (!pod || !column) {
            return null;
        }

        let textToRender: string = "";
        switch (column.key) {
            case podStatusKey:
                return (
                    <div>
                        {
                            <Status {...podStatusDic[pod.status.phase]} animated={false} size={StatusSize.s} />
                        }
                        <span className="pod-name"> {pod.metadata.name}</span>
                    </div>
                );
            case podIPKey:
                textToRender = pod.status.podIP;
                break;

            case podAgeKey:
                return (
                    <Duration startDate={new Date(pod.metadata.creationTimestamp)} endDate={new Date()} />
                );
        }

        return ListComponent.renderColumn(textToRender, ListComponent.defaultColumnRenderer, "pdl-col-data");
    }

    private _getReplicaSetLabels(): React.ReactNode | null {
        var podLabels = this.props.replicaSet.metadata.labels;
        var labels = new ObservableArray<ILabelModel>();
        if (podLabels) {
            Object.keys(podLabels).forEach((key: string) => {
                labels.push({ content: format("{0}:{1}", key, podLabels[key]) });
            });

            return <LabelGroup labelProps={labels} wrappingBehavior={WrappingBehavior.OneLine} fadeOutOverflow />;
        }

        return null;
    }

    private _getReplicaSetDescription(): JSX.Element | null {
        if (this.props.replicaSet.metadata
            && this.props.replicaSet.metadata.creationTimestamp) {
            var des = "";
            var imageName = this._getImageName();
            if (imageName) {
                des = format(Resources.AgoBy, imageName)
            }

            return (
                <div className="replicaset-description-section sub-heading">
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
            return this.props.replicaSet.spec.template.spec.containers[0].image
        }

        return null;
    }
}

const podStatusDic: { [index: string]: IStatusProps } = {
    "Running": Statuses.Success,
    "Pending": Statuses.Waiting,
    "Succeeded": Statuses.Success,
    "Failed": Statuses.Failed,
};
const podStatusKey = "pods-list-status-col";
const podIPKey = "pods-list-ip-col";
const podAgeKey = "pods-list-age-col";
