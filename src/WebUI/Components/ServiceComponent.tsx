/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import { localeFormat, format } from "azure-devops-ui/Core/Util/String";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceComponent.scss";
import { V1PodList, V1Pod } from "@kubernetes/client-node";
import { PodsComponent } from "./PodsComponent";
import { ZeroDataComponent } from "./ZeroDataComponent";

export interface IServiceComponentProperties extends IVssComponentProperties {
    service: IServiceItem;
    podListingPromise?: Promise<V1PodList>;
}

export interface IServiceComponentState {
    pods:Array<V1Pod>;
}

export class ServiceComponent extends BaseComponent<IServiceComponentProperties, IServiceComponentState> {
    constructor(props: IServiceComponentProperties) {
        super(props, {});
        this.state = {
            pods: []
        };
    }

    public render(): JSX.Element {
        return (
            <div className="service-main-content">
                {this._getMainHeading()}
                {this._getServiceDetails()}
                {this._getAssociatedPods()}
            </div>
        );
    }

    private _getMainHeading(): JSX.Element | null {
        const item = this.props.service;
        if (item) {
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
            return (
                <div className="content-main-heading">
                    <h2 className="title-heading">{item.package}</h2>
                    <div className="sub-heading">
                        {localeFormat(Resources.ServiceCreatedText, agoTime)}
                    </div>
                </div>
            );
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const columns: ITableColumn<any>[] = [
                {
                    id: "key",
                    name: "key",
                    width: new ObservableValue(200),
                    className: "s-key",
                    minWidth: 180,
                    renderCell: renderSimpleCell
                },
                {
                    id: "value",
                    name: "value",
                    width: new ObservableValue(500),
                    className: "s-value",
                    minWidth: 400,
                    renderCell: ServiceComponent._renderValueCell
                },
                ColumnFill
            ];
            const tableItems = new ArrayItemProvider<any>([
                { key: Resources.LabelsText, value: item.service.metadata.labels || {} },
                { key: Resources.SelectorText, value: item.service.spec.selector || {} },
                { key: Resources.TypeText, value: item.type },
                { key: Resources.ClusterIPText, value: item.clusterIP },
                { key: Resources.ExternalIPText, value: item.externalIP },
                { key: Resources.PortText, value: item.port },
                { key: Resources.SessionAffinityText, value: item.service.spec.sessionAffinity || "" }
            ]);

            return (
                <div className="kube-list-content s-details depth-16">
                    <h3 className="s-de-heading">{Resources.DetailsText}</h3>
                    <Table
                        className="s-full-details"
                        id={format("s-full-details-{0}", item.uid)}
                        showHeader={false}
                        showLines={true}
                        singleClickActivation={false}
                        itemProvider={tableItems}
                        pageSize={tableItems.getCount()}
                        columns={columns}
                    />
                </div>
            );
        }

        return null;
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        switch (key) {
            case Resources.LabelsText:
            case Resources.SelectorText:
                const props = {
                    columnIndex: columnIndex,
                    children:
                        <LabelGroup
                            labelProps={Utils.getUILabelModelArray(value)}
                            wrappingBehavior={WrappingBehavior.FreeFlow}
                            fadeOutOverflow={true}
                        />,
                    tableColumn: tableColumn
                };

                return renderTableCell(props);

            default:
                return (<div className="kube-simple-cell">
                        { renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem) }
                    </div>);
        }
    }

    public componentDidMount(): void {
        console.log("getting items");
        this.props.podListingPromise && this.props.podListingPromise.then(podList => {
            podList &&
            podList.items &&
                this.setState({
                    pods: podList.items
                });
        }).catch(error => {
            console.log(error);
        });
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.pods.length === 0) {
            return (
                <ZeroDataComponent
                    imagePath={require("../zero_data.png")}
                    title={Resources.AssociatedPodsText}
                    textline1={Resources.NoPodsForSvcText}
                    hyperLink="https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/"
                    hyperLinkLabel={Resources.LearnMoreText}
                    textline2={Resources.LinkSvcToPodsText}
                />
            );
        }
        return (
            <PodsComponent
                podsToRender={this.state.pods}
                headingText={Resources.AssociatedPodsText}
            />
        );
    }

}