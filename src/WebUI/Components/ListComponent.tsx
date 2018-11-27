import * as React from "react";

import { VssDetailsList } from "azure-devops-ui/VssDetailsList";
import { css, BaseComponent } from "office-ui-fabric-react/lib/Utilities";
import { TooltipHost, TooltipOverflowMode } from "azure-devops-ui/Tooltip";
import { ConstrainMode, SelectionMode } from "office-ui-fabric-react/lib/DetailsList";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";

import { IVssComponentProperties } from "../Types";

export interface IListComponentProperties<T> extends IVssComponentProperties {
    headingText: string;
    items: T[];
    columns: IColumn[];
    onRenderItemColumn: (item?: T, index?: number, column?: IColumn) => React.ReactNode;
}

export class ListComponent<T> extends BaseComponent<IListComponentProperties<T>>{
    public render(): React.ReactNode {
        return (
            <div className={css("kube-list-content", this.props.className)}>
                <h2 className={"kube-list-heading heading"}>{this.props.headingText}</h2>
                <VssDetailsList
                    className={"kube-list"}
                    items={this.props.items}
                    columns={this.props.columns}
                    onRenderItemColumn={this.props.onRenderItemColumn}
                    isHeaderVisible={true}
                    selectionMode={SelectionMode.single}
                    constrainMode={ConstrainMode.unconstrained}
                />
            </div>
        );
    }

    public static renderColumn(text: string, renderer: (text: string, className?: string) => React.ReactNode, className?: string): React.ReactNode {
        if (text && renderer) {
            return renderer(text, className);
        }
        else {
            return null;
        }
    }

    public static defaultColumnRenderer(text: string, className?: string): React.ReactNode {
        return (
            <div className={css("kube-list-col-data overflow-ellipsis", className)}>
                <TooltipHost content={text} overflowMode={TooltipOverflowMode.Parent}>
                    {text}
                </TooltipHost>
            </div>
        );
    }
}
