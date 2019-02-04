import { BaseComponent, css } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { Ago } from "azure-devops-ui/Ago";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import "./PodsComponent.scss";
import { V1Pod } from "@kubernetes/client-node";
import { Utils } from "../Utils";
import { StatusSize, Status } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { PodStatusComponent } from "./PodStatusComponent";
import "azure-devops-ui/Components/TooltipEx/Tooltip.scss";

const podNameKey:string = "pl-name-key";
const podImageKey:string = "pl-image-key";
const podStatusKey:string = "pl-status-key";
const podAgeKey:string = "pl-age-key";

export interface IPodsComponentProperties extends IVssComponentProperties {
    podsToRender:V1Pod[];
    headingText?:string;
}


export class PodsComponent extends BaseComponent<IPodsComponentProperties> {
    public render(): React.ReactNode {

        return (
            <ListComponent
                headingText={this.props.headingText}
                className={css("list-content", "pl-details", "depth-16")}
                items={this.props.podsToRender}
                columns={PodsComponent._getColumns()}
                onRenderItemColumn={PodsComponent._onRenderItemColumn}
            />
        );
    }

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = css("list-col-content");

        columns.push({
            key: podNameKey,
            name: Resources.PodsDetailsText,
            fieldName: podNameKey,
            minWidth: 250,
            maxWidth: 500,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podImageKey,
            name: Resources.ImageText,
            fieldName: podImageKey,
            minWidth: 250,
            maxWidth: 500,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podStatusKey,
            name: Resources.StatusText,
            fieldName: podStatusKey,
            minWidth: 80,
            maxWidth: 160,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podAgeKey,
            name: Resources.AgeText,
            fieldName: podAgeKey,
            minWidth: 80,
            maxWidth: 160,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        return columns;
    }

    private static _onRenderItemColumn(pod?: V1Pod, index?: number, column?: IColumn): React.ReactNode {
        if (!pod || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "list-col-content";
        switch (column.key) {
            case podNameKey:
                textToRender = pod.metadata.name;
                colDataClassName = css(colDataClassName, "primary-text");
                break;

            case podImageKey:
                textToRender = pod.spec.containers[0].image;
                break;

            case podStatusKey:
                    let statusDescription: string = "";
                    let customDescription: React.ReactNode = null;

                    if(pod.status.message) {
                        customDescription = (
                            <Tooltip showOnFocus={true} text={pod.status.message}>
                                <div className="kube-status-desc">{pod.status.reason}</div>
                            </Tooltip>
                        );
                    }
                    else {
                        statusDescription = pod.status.phase;
                    }

                    return (<PodStatusComponent 
                        statusProps={Utils.generatePodStatusProps(pod.status)} 
                        statusDescription={statusDescription} 
                        customDescription={customDescription}
                    />);

            case podAgeKey:
                return (pod.status && pod.status.startTime ? <Ago date={new Date(pod.status.startTime)} /> : null);
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }
}
