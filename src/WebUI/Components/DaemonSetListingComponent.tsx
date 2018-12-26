import { V1DaemonSet, V1DaemonSetList } from "@kubernetes/client-node";
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
                <ListComponent
                    className={css("list-content", "top-padding", "depth-16" )}
                    items={this.props.daemonSetList.items || [] }
                    columns={DaemonSetListingComponent._getColumns()}
                    onRenderItemColumn={DaemonSetListingComponent._onRenderItemColumn}
                />
            }</div>
        );
    }

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "secondary-text";

        columns.push({
            key: setNameKey,
            name: Resources.DaemonSetText,
            fieldName: setNameKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled
        });

        columns.push({
            key: imageKey,
            name: Resources.ImageText,
            fieldName: imageKey,
            minWidth: 250,
            maxWidth: 250,
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
        let colDataClassName: string = "list-col-content";
        switch (column.key) {
            case setNameKey:
                return ListComponent.renderTwoLineColumn(daemonSet.metadata.name,
                                                        Utils.getPipelineText(daemonSet.metadata.annotations),
                                                        colDataClassName,"primary-text", "secondary-text");
            case imageKey:
                textToRender = daemonSet.spec.template.spec.containers[0].image;
                break;
            case podsKey: {
                let statusProps: IStatusProps | undefined;
                let podString: string = "";
                if (daemonSet.status.desiredNumberScheduled > 0) {
                    statusProps = Utils._getPodsStatusProps(daemonSet.status.currentNumberScheduled, daemonSet.status.desiredNumberScheduled);
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
}