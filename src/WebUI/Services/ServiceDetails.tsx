/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Statuses } from "azure-devops-ui/Status";
import { ITableColumn, renderSimpleCell, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { renderTableCell } from "../Common/KubeCardWithTable";
import { KubeSummary } from "../Common/KubeSummary";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { ServicesEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsDetails } from "../Pods/PodsDetails";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceDetails.scss";
import { ServicesStore } from "./ServicesStore";

export interface IServiceDetailsProperties extends IVssComponentProperties {
    service: IServiceItem;
    parentKind: string;
}

export interface IServiceDetailsState {
    pods: Array<V1Pod>;
    selectedPod: V1Pod | null;
    showSelectedPod: boolean;
}

const LoadBalancerText: string = "LoadBalancer";

export class ServiceDetails extends BaseComponent<IServiceDetailsProperties, IServiceDetailsState> {
    constructor(props: IServiceDetailsProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null,
            showSelectedPod: false
        };
        this._servicesStore = StoreManager.GetStore<ServicesStore>(ServicesStore);
        this._podsActionsCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);

        const svc = this.props.service && this.props.service.service;
        // service currently only supports equals with "and" operator. The generator generates that condition.
        const labelSelector: string = Utils.generateEqualsConditionLabelSelector(svc && svc.spec && svc.spec.selector || {});
        this._podsActionsCreator.getPods(KubeSummary.getKubeService(), labelSelector);
        this._servicesStore.addListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    public render(): JSX.Element {
        if (this.state.selectedPod && this.state.showSelectedPod) {
            const service = this.props.service && this.props.service.service;
            const serviceName = service && service.metadata ? service.metadata.name : "";
            return (
                <PodsDetails
                    pods={this.state.pods}
                    parentName={serviceName}
                    selectedPod={this.state.selectedPod}
                    parentKind={this.props.parentKind}
                    onBackButtonClick={this._setSelectedPodStateFalse}
                />
            );
        }

        return (
            <Page className="service-details-page flex flex-grow">
                {this._getMainHeading()}
                <div className="service-details-page-content page-content page-content-top">
                    {this._getServiceDetails()}
                    {this._getAssociatedPods()}
                </div>
            </Page>
        );
    }

    public componentWillUnmount(): void {
        this._servicesStore.removeListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    private _getMainHeading(): JSX.Element | null {
        const item = this.props.service;
        if (item) {
            const statusProps = item.type === LoadBalancerText && !item.externalIP ? Statuses.Running : Statuses.Success;
            return <PageTopHeader title={item.package} statusProps={statusProps} />;
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const tableItems: IServiceItem[] = [ServiceDetails._getServiceDetailsObject(item)];
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);
            const pipelineText = item.pipeline
                ? localeFormat(Resources.ServiceCreatedWithPipelineText, agoTime, item.pipeline)
                : localeFormat(Resources.CreatedAgo, agoTime);

            return (
                <CustomCard className="service-details-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                    {Resources.ServiceDetails}
                                </HeaderTitle>
                            </HeaderTitleRow>
                            <HeaderDescription className={"text-ellipsis"}>
                                {pipelineText}
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className="service-full-details-table" contentPadding={false}>
                        <Table
                            id="service-full-details-table"
                            showHeader={true}
                            showLines={false}
                            singleClickActivation={false}
                            itemProvider={new ArrayItemProvider<IServiceItem>(tableItems)}
                            columns={ServiceDetails._getColumns()}
                        />
                    </CardContent>
                </CustomCard>
            );
        }

        return null;
    }

    private _onPodsFetched = (): void => {
        const pods = this._servicesStore.getState().podsList;
        this.setState({
            pods: pods || []
        });
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (!this.state.pods || this.state.pods.length === 0) {
            return KubeZeroData.getServiceAssociatedPodsZeroData();
        }

        return (
            <PodsTable
                contentClassName="service-pods-table"
                podsToRender={this.state.pods}
                headingText={Resources.AssociatedPodsText}
                onItemActivated={this._onSelectedPodInvoked}
                showWorkloadsColumn={true}
            />
        );
    }

    private _onSelectedPodInvoked = (event: React.SyntheticEvent<HTMLElement>, pod: V1Pod) => {
        this.setState({
            showSelectedPod: true,
            selectedPod: pod
        });
    }

    private _setSelectedPodStateFalse = () => {
        this.setState({
            showSelectedPod: false,
            selectedPod: null
        });
    }

    private static _getServiceDetailsObject(item: IServiceItem): any {
        return {
            type: item.type,
            clusterIP: item.clusterIP,
            externalIP: item.externalIP,
            port: item.port,
            sessionAffinity: item.service ? item.service.spec.sessionAffinity : "",
            selector: item.service ? item.service.spec.selector : {},
            labels: item.service ? item.service.metadata.labels : {}
        };
    }

    private static _getColumns(): ITableColumn<IServiceItem>[] {
        const columns: ITableColumn<any>[] = [
            {
                id: "type",
                name: Resources.TypeText,
                width: -100,
                minWidth: 104,
                renderCell: renderSimpleCell
            },
            {
                id: "clusterIP",
                name: Resources.ClusterIPText,
                width: -100,
                minWidth: 104,
                renderCell: renderSimpleCell
            },
            {
                id: "externalIP",
                name: Resources.ExternalIPText,
                width: -100,
                minWidth: 104,
                renderCell: renderSimpleCell
            },
            {
                id: "port",
                name: Resources.PortText,
                width: -100,
                minWidth: 104,
                renderCell: renderSimpleCell
            },
            {
                id: "sessionAffinity",
                name: Resources.SessionAffinityText,
                width: -100,
                minWidth: 104,
                renderCell: renderSimpleCell
            },
            {
                id: "selector",
                name: Resources.SelectorText,
                width: -100,
                minWidth: 120,
                renderCell: ServiceDetails._renderTags
            },
            {
                id: "labels",
                name: Resources.LabelsText,
                width: -100,
                minWidth: 312,
                renderCell: ServiceDetails._renderTags
            }
        ];

        return columns;
    }

    private static _renderTags(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, item: any): JSX.Element {
        const itemToRender: React.ReactNode = <Tags items={item[tableColumn.id]} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _servicesStore: ServicesStore;
    private _podsActionsCreator: PodsActionsCreator;
}