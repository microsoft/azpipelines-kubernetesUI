import { autobind } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { TooltipHost, TooltipOverflowMode } from "azure-devops-ui/Tooltip";
import { VssDetailsList } from "azure-devops-ui/VssDetailsList";
import { ConstrainMode, SelectionMode } from "office-ui-fabric-react/lib/DetailsList";
import { BaseComponent, css } from "office-ui-fabric-react/lib/Utilities";
import * as React from "react";
import { IVssComponentProperties } from "../Types";
import "./ListComponent.scss";

export interface IListComponentProperties<T> extends IVssComponentProperties {
    headingText?: string;
    headingContent?: JSX.Element;
    items: T[];
    columns: IColumn[];
    onRenderItemColumn: (item?: T, index?: number, column?: IColumn) => React.ReactNode;
    onItemInvoked?: (item?: any, index?: number, ev?: Event) => void;
}

export class ListComponent<T> extends BaseComponent<IListComponentProperties<T>> {
    public render(): React.ReactNode {
        return (
            <div className={css("kube-list-content", this.props.className)}>
                {this._getComponentHeadingContent()}
                {this._getComponent()}
            </div>
        );
    }

    private _getComponent(): JSX.Element {
        return (
            <VssDetailsList
                className={"kube-list"}
                items={this.props.items}
                columns={this.props.columns}
                onRenderItemColumn={this.props.onRenderItemColumn}
                isHeaderVisible={true}
                selectionMode={SelectionMode.single}
                constrainMode={ConstrainMode.unconstrained}
                onItemInvoked={this._onItemInvoked}
            />
        );
    }

    public static renderColumn(
        text: string,
        renderer: (text: string, className?: string) => React.ReactNode, className?: string): React.ReactNode {
        return text && renderer ? renderer(text, className) : null;
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

    private _onItemInvoked = (item?: any, index?: number, ev?: Event) => {
        if (this.props.onItemInvoked) {
            this.props.onItemInvoked(item, index, ev);
        }
    }

    private _getComponentHeadingContent(): JSX.Element {
        return (
            <div className={"kube-list-heading heading"}>
                {this.props.headingText
                    ? <h3 className={"heading-title"}>{this.props.headingText}</h3>
                    : this.props.headingContent && this.props.headingContent}
            </div>
        );
    }
}
