/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1Service } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { Statuses } from "azure-devops-ui/Status";
import { ITableColumn, renderSimpleCell, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { createBrowserHistory } from "history";
import * as queryString from "query-string";
import * as React from "react";
import { renderTableCell, renderExternalIpCell } from "../Common/KubeCardWithTable";
import { KubeSummary } from "../Common/KubeSummary";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { SelectedItemKeys, ServicesEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { getRunDetailsText } from "../RunDetails";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { IPodDetailsSelectionProperties, IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceDetails.scss";
import { ServicesActionsCreator } from "./ServicesActionsCreator";
import { ServicesStore } from "./ServicesStore";
import { getServiceItems } from "./ServiceUtils";

export interface IServiceDetailsProperties extends IVssComponentProperties {
    service: IServiceItem | undefined;
    parentKind: string;
    notifyViewChanged?: (viewTree: { id: string, displayName: string, url: string }[]) => void;
}

export interface IServiceDetailsState {
    service: IServiceItem | undefined;
    pods: Array<V1Pod>;
    arePodsLoading?: boolean;
    hoverRowIndex: number;
}

const LoadBalancerText: string = "LoadBalancer";

export class ServiceDetails extends BaseComponent<IServiceDetailsProperties, IServiceDetailsState> {
    constructor(props: IServiceDetailsProperties) {
        super(props, {});
        this.state = {
            service: props.service,
            pods: [],
            arePodsLoading: true,
            hoverRowIndex: -1
        };

        const notifyViewChanged = (service: V1Service) => {
            if (service.metadata && props.notifyViewChanged) {
                const metadata = service.metadata;
                props.notifyViewChanged([{ id: SelectedItemKeys.ServiceItemKey + metadata.uid, displayName: metadata.name, url: window.location.href }]);
            }
        };

        if (props.service && props.service.service) {
            notifyViewChanged(props.service.service);
        }

        this._podsActionsCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);
        this._servicesStore = StoreManager.GetStore<ServicesStore>(ServicesStore);
        const fetchServiceDetails = (svc: V1Service) => {
            // service currently only supports equals with "and" operator. The generator generates that condition.
            const labelSelector: string = Utils.generateEqualsConditionLabelSelector(svc && svc.spec && svc.spec.selector || {});
            this._podsActionsCreator.getPods(KubeSummary.getKubeService(), labelSelector, true);
        };

        if (!props.service) {
            ActionsCreatorManager.GetActionCreator<ServicesActionsCreator>(ServicesActionsCreator).getServices(KubeSummary.getKubeService());
            const getServicesHandler = () => {
                this._servicesStore.removeListener(ServicesEvents.ServicesFetchedEvent, getServicesHandler);
                const history = createBrowserHistory();
                const queryParams = queryString.parse(history.location.search);
                const servicesList = this._servicesStore.getState().serviceList;
                const services = (servicesList && servicesList.items) || [];
                const selectedService = services.find(s => s.metadata.uid === queryParams.uid);
                if (selectedService) {
                    notifyViewChanged(selectedService);
                    fetchServiceDetails(selectedService);
                    this.setState({
                        service: getServiceItems([selectedService])[0]
                    });
                }

            };

            this._servicesStore.addListener(ServicesEvents.ServicesFetchedEvent, getServicesHandler);
        } else if (props.service.service) {
            fetchServiceDetails(props.service.service);
        }

        this._servicesStore.addListener(ServicesEvents.ServicePodsFetchedEvent, this._onPodsFetched);
    }

    public render(): JSX.Element {
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
        const item = this.state.service;
        if (item) {
            const statusProps = item.type === LoadBalancerText && !item.externalIP ? Statuses.Running : Statuses.Success;
            return <PageTopHeader title={item.package} statusProps={statusProps} />;
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.state.service;
        if (item && item.service) {
            const tableItems: IServiceItem[] = [ServiceDetails._getServiceDetailsObject(item)];
            const agoTime = Date_Utils.ago(new Date(item.creationTimestamp), Date_Utils.AgoFormat.Compact);

            return (
                <CustomCard className="service-details-card k8s-card-padding bolt-table-card flex-grow bolt-card-no-vertical-padding">
                    <CustomHeader>
                        <HeaderTitleArea>
                            <HeaderTitleRow>
                                <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                    {Resources.ServiceDetails}
                                </HeaderTitle>
                            </HeaderTitleRow>
                            <HeaderDescription className={"text-ellipsis"}>
                                {
                                    getRunDetailsText(item.service.metadata.annotations, undefined, agoTime)
                                }
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
                            columns={this._getColumns()}
                        />
                    </CardContent>
                </CustomCard >
            );
        }

        return null;
    }

    private _onPodsFetched = (): void => {
        const servicesStoreState = this._servicesStore.getState();
        this.setState({
            pods: servicesStoreState.podsList || [],
            arePodsLoading: servicesStoreState.arePodsLoading
        });
    }

    private _getAssociatedPods(): JSX.Element | null {
        if (this.state.arePodsLoading) {
            return <Spinner className={"flex flex-grow loading-pods"}
                size={SpinnerSize.large}
                label={Resources.LoadingPodsSpinnerLabel} />;
        }

        if (!this.state.pods || this.state.pods.length === 0) {
            return KubeZeroData.getServiceAssociatedPodsZeroData();
        }

        return (
            <PodsTable
                contentClassName="service-pods-table"
                podsToRender={this.state.pods}
                headingText={Resources.AssociatedPodsText}
                onItemActivated={this._onSelectedPodInvoked}
                showWorkloadColumn={true}
            />
        );
    }

    private _onSelectedPodInvoked = (event: React.SyntheticEvent<HTMLElement>, pod: V1Pod) => {
        const selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        const service = this.state.service!.service!;
        selectionActionCreator.selectItem(
            {
                item: pod,
                itemUID: pod.metadata.uid,
                selectedItemType: SelectedItemKeys.PodDetailsKey,
                showSelectedItem: true,
                properties: {
                    parentUid: service.metadata.uid,
                    serviceSelector: Utils.generateEqualsConditionLabelSelector((service.spec && service.spec.selector) || {}),
                    serviceName: service.metadata.name,
                } as IPodDetailsSelectionProperties
            }
        );
    }

    private static _getServiceDetailsObject(item: IServiceItem): any {
        return {
            type: item.type,
            clusterIP: item.clusterIP || "-",
            externalIP: item.externalIP,
            port: item.port,
            sessionAffinity: item.service ? item.service.spec.sessionAffinity : "",
            selector: item.service ? item.service.spec.selector : {},
            labels: item.service ? item.service.metadata.labels : {}
        };
    }

    private _getColumns = (): ITableColumn<IServiceItem>[] => {
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
                renderCell: (rowIndex, columnIndex, tableColumn, item) => renderExternalIpCell(rowIndex, columnIndex, tableColumn, item, this._setHoverRowIndex, this.state.hoverRowIndex)
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
                renderCell: this._renderTags
            },
            {
                id: "labels",
                name: Resources.LabelsText,
                width: -100,
                minWidth: 312,
                renderCell: this._renderTags
            }
        ];

        return columns;
    }

    private _renderTags(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, item: any): JSX.Element {
        const itemToRender: React.ReactNode = <Tags items={item[tableColumn.id]} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _setHoverRowIndex = (hoverRowIndex: number): void => {
        this.setState({
            hoverRowIndex: hoverRowIndex
        });
    }

    private _servicesStore: ServicesStore;
    private _podsActionsCreator: PodsActionsCreator;
}
