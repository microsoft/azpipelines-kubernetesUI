/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { ListComponent } from "./ListComponent";
import "./PodsComponent.scss";
import { PodStatusComponent } from "./PodStatusComponent";

const podNameKey: string = "pl-name-key";
const podImageKey: string = "pl-image-key";
const podStatusKey: string = "pl-status-key";
const podAgeKey: string = "pl-age-key";

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
                return (
                    <PodStatusComponent
                        statusProps={Utils.generatePodStatusProps(pod.status)}
                        statusDescription={pod.status.phase}
                        customStatusDescription={pod.status.reason || ""}
                        customTooltipText={pod.status.message || ""}
                    />
                );

            case podAgeKey:
                return <Ago date={new Date(pod.status.startTime)} />;
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }
}
