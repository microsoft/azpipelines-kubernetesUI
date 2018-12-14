import { V1DaemonSet, V1DaemonSetList } from "@kubernetes/client-node";
import { BaseComponent, css, format } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import "./DaemonSetListingComponent.scss";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import { Ago } from "azure-devops-ui/Ago";
import { Utils } from "../Utils";

const setNameKey = "set-name-key";
const imageKey = "image-key";
const podsKey = "pods-key";
const ageKey = "age-key";

export interface IDaemonSetComponentProperties extends IVssComponentProperties {
    daemonSetList: V1DaemonSetList;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
}


export class DaemonSetListingComponent extends BaseComponent<IDaemonSetComponentProperties, {}> {
    public render(): React.ReactNode {
        return (
            <div>{
                this.props.daemonSetList &&
                this.props.daemonSetList.items &&
                <ListComponent
                    className={css("ds-list-view", "depth-16")}
                    items={this.props.daemonSetList.items}
                    columns={DaemonSetListingComponent._getColumns()}
                    onRenderItemColumn={DaemonSetListingComponent._onRenderItemColumn}
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
        const headerColumnClassName: string = "ds-secondary-text";

        columns.push({
            key: setNameKey,
            name: Resources.DaemonSetText,
            fieldName: setNameKey,
            minWidth: 140,
            maxWidth: 140,
            headerClassName: headerColumnClassName,
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
    private static _onRenderItemColumn(daemonSet?: V1DaemonSet, index?: number, column?: IColumn): React.ReactNode {
        if (!daemonSet || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "ds-list-col-content";
        switch (column.key) {
            case setNameKey:
                return ListComponent.renderTwoLineColumn(daemonSet.metadata.name,
                                                        Utils.getPipelineText(daemonSet.metadata.annotations),
                                                        colDataClassName,"ds-primary-text", "ds-secondary-text");
            case imageKey:
                textToRender = daemonSet.spec.template.spec.containers[0].image;
                break;
            case podsKey: {
                let statusProps: IStatusProps | undefined;
                let podString: string = "";
                if (daemonSet.status.desiredNumberScheduled > 0) {
                    statusProps = DaemonSetListingComponent._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
                    podString = format("{0}/{1}", daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
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
                return (<Ago date={new Date(daemonSet.metadata.creationTimestamp)} />);
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