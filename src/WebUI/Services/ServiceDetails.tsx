/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { Page } from "azure-devops-ui/Page";
import { Statuses } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import { renderTableCell } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { ServicesEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsDetails } from "../Pods/PodsDetails";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { ServicesStore } from "./ServicesStore";

export interface IServiceDetailsProperties extends IVssComponentProperties {
    kubeService: IKubeService;
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
        this._podsActionsCreator.getPods(this.props.kubeService, labelSelector);
        this._servicesStore.addListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    public render(): JSX.Element {
        if (this.state.selectedPod && this.state.showSelectedPod) {
            const service = this.props.service && this.props.service.service;
            const serviceName = service && service.metadata ? service.metadata.name : "";
            return (
                <PodsDetails
                    pods={this.state.pods}
                    selectedPod={this.state.selectedPod}
                    parentName={serviceName}
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

    private static _getColumns(): ITableColumn<IServiceItem>[] {
        const columns: ITableColumn<any>[] = [
            {
                id: "type",
                name: Resources.TypeText,
                width: -100,
                minWidth: 80,
                renderCell: ServiceDetails._renderTextCell
            },
            {
                id: "clusterIp",
                name: Resources.ClusterIPText,
                width: -100,
                minWidth: 80,
                renderCell: ServiceDetails._renderTextCell
            },
            {
                id: "externalIp",
                name: Resources.ExternalIPText,
                width: -100,
                minWidth: 80,
                renderCell: ServiceDetails._renderTextCell
            },
            {
                id: "port",
                name: Resources.PortText,
                width: -100,
                minWidth: 80,
                renderCell: ServiceDetails._renderTextCell
            },
            {
                id: "sessAffinity",
                name: Resources.SessionAffinityText,
                width: -100,
                minWidth: 80,
                renderCell: ServiceDetails._renderTextCell
            },
            {
                id: "selector",
                name: Resources.SelectorText,
                width: -100,
                minWidth: 200,
                renderCell: ServiceDetails._renderTags
            },
            {
                id: "labels",
                name: Resources.LabelsText,
                width: -100,
                minWidth: 200,
                renderCell: ServiceDetails._renderTags
            }
        ];

        return columns;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.props.service;
        if (item && item.service) {
            const tableItems: IServiceItem[] = [item];
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);

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
                                {
                                    item.pipeline
                                        ? localeFormat(Resources.CreatedTextWithPipelineText, agoTime, item.pipeline)
                                        : localeFormat(Resources.CreatedAgo, agoTime)
                                }
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent contentPadding={false}>
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

    private static _renderTextCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element {
        const text = ServiceDetails._getCellText(tableColumn, rowIndex, service);
        const itemToRender = (
            <Tooltip text={text} overflowOnly>
                <span className="text-ellipsis">{text}</span>
            </Tooltip>
        );

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _getCellText(tableColumn: ITableColumn<IServiceItem>, rowIndex: number, service:IServiceItem): string {
        let textToRender: string = "";
        switch (tableColumn.id) {
            case "type":
                textToRender = service.type;
                break;
            case "clusterIp":
                textToRender = service.clusterIP;
                break;
            case "externalIp":
                textToRender = service.externalIP;
                break;
            case "port":
                textToRender = service.port;
                break;
            case "sessAffinity":
                textToRender = service.service ? service.service.spec.sessionAffinity : "";
                break;
        }

        return textToRender;
    }

    private static _renderTags(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, item: IServiceItem): JSX.Element {
        let labelsArray: { [key: string]: string } = {};

        switch (tableColumn.id) {
            case "selector":
                labelsArray = item.service ? item.service.spec.selector : {};
                break;
            case "labels":
                labelsArray = item.service ? item.service.metadata.labels : {};
                break;
        }

        const itemToRender: React.ReactNode = (
            <LabelGroup
                labelProps={Utils.getUILabelModelArray(labelsArray)}
                wrappingBehavior={WrappingBehavior.freeFlow}
            />
        );

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _servicesStore: ServicesStore;
    private _podsActionsCreator: PodsActionsCreator;
}