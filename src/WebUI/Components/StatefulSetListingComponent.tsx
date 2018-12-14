import { V1StatefulSet, V1StatefulSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { Utils } from "../Utils";
import "./StatefulSetListingComponent.scss";

const setNameKey = "statefulset-name-key";
const imageKey = "statefulset-image-key";
const podsKey = "statefulset-pods-key";
const ageKey = "statefulset-age-key";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    statefulSetList: V1StatefulSetList;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
}


export class StatefulSetListingComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        console.log(this.props.statefulSetList && this.props.statefulSetList.items&& this.props.statefulSetList.items.length);
        return (
            <div>{
                this.props.statefulSetList &&
                this.props.statefulSetList.items &&
                <ListComponent
                    className={css("stful-set-list-view", "depth-16")}
                    items={this.props.statefulSetList.items}
                    columns={StatefulSetListingComponent._getColumns()}
                    onRenderItemColumn={StatefulSetListingComponent._onRenderItemColumn}
                />
            }</div>
        );
    }

    // private _openDeploymentItem = (item?: any, index?: number, ev?: Event) => {
    //     if (this.props.onItemInvoked) {
    //         this.props.onItemInvoked(item, index, ev);
    //     }
    // }

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "stful-set-secondary-text";

        columns.push({
            key: setNameKey,
            name: Resources.StatefulSetText,
            fieldName: setNameKey,
            minWidth: 140,
            maxWidth: 140,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: imageKey,
            name: Resources.ImageText,
            fieldName: imageKey,
            minWidth: 160,
            maxWidth: 160,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: podsKey,
            name: Resources.PodsText,
            fieldName: podsKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: ageKey,
            name: Resources.AgeText,
            fieldName: ageKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });


        return columns;
    }
    private static _onRenderItemColumn(statefulSet?: V1StatefulSet, index?: number, column?: IColumn): React.ReactNode {
        if (!statefulSet || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "stful-set-list-col-content";
        switch (column.key) {
            case setNameKey:
                return ListComponent.renderTwoLineColumn(statefulSet.metadata.name,
                    Utils.getPipelineText(statefulSet.metadata.annotations),
                    colDataClassName,"stful-set-primary-text", "stful-set-secondary-text");
            case imageKey:
                textToRender = statefulSet.spec.template.spec.containers[0].image;
                break;
            case podsKey: {
                let statusProps: IStatusProps | undefined;
                let podString: string = "";
                if (statefulSet.status.replicas > 0) {
                    statusProps = StatefulSetListingComponent._getPodsStatusProps(statefulSet.status.currentReplicas, statefulSet.status.replicas);
                    podString = format("{0}/{1}", statefulSet.status.currentReplicas, statefulSet.status.replicas);
                }
                return (
                    <div>
                        {
                            !!statusProps &&
                            <Status {...statusProps} size={StatusSize.m} />
                        }
                        <span>{podString}</span>
                    </div>);
            }
            case ageKey: {
                return (<Ago date={new Date(statefulSet.metadata.creationTimestamp)} />);
            }
        }
        return ListComponent.renderColumn(textToRender||"",ListComponent.defaultColumnRenderer,colDataClassName);
    }

    private static _getPodsStatusProps(currentScheduledPods: number, desiredPods: number): IStatusProps | undefined {
        //todo modify logic to base on pod events so that we can distinguish between pending/failed pods
        if (desiredPods != null && currentScheduledPods != null && desiredPods > 0) {
            return currentScheduledPods < desiredPods ? Statuses.Failed : Statuses.Success;
        }

        return undefined;
    }

}