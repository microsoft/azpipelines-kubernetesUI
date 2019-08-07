/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1Service } from "@kubernetes/client-node";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import * as Utils_Accessibility from "azure-devops-ui/Core/Util/Accessibility";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { Statuses } from "azure-devops-ui/Status";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { createBrowserHistory } from "history";
import * as React from "react";
import * as queryString from "simple-query-string";
import * as Resources from "../../Resources";
import { defaultColumnRenderer, renderExternalIpWithCopy } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { Scenarios, SelectedItemKeys, ServicesEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { getTelemetryService, KubeFactory } from "../KubeFactory";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsTable } from "../Pods/PodsTable";
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
    copyTooltipText?: string;
}

const LoadBalancerText: string = "LoadBalancer";

export class ServiceDetails extends React.Component<IServiceDetailsProperties, IServiceDetailsState> {
    constructor(props: IServiceDetailsProperties) {
        super(props, {});
        this.state = {
            service: props.service,
            pods: [],
            arePodsLoading: true,
            copyTooltipText: Resources.CopyExternalIp
        };

        getTelemetryService().scenarioStart(Scenarios.ServiceDetails);
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
            this._podsActionsCreator.getPods(KubeFactory.getKubeService(), labelSelector, true);
        };

        if (!props.service) {
            ActionsCreatorManager.GetActionCreator<ServicesActionsCreator>(ServicesActionsCreator).getServices(KubeFactory.getKubeService());
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

    private _markTTI = () => {
        if (!this._isTTIMarked) {
            getTelemetryService().scenarioEnd(Scenarios.ServiceDetails);
        }
        this._isTTIMarked = true;
    }

    private _getMainHeading(): JSX.Element | null {
        const item = this.state.service;
        if (item) {
            const statusProps = item.type === LoadBalancerText && !item.externalIP ? Statuses.Running : Statuses.Success;
            return <PageTopHeader className="s-details-header" title={item.package} statusProps={statusProps} />;
        }

        return null;
    }

    private _getServiceDetails(): JSX.Element | null {
        const item = this.state.service;
        if (item && item.service) {
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
                                    getRunDetailsText(item.service.metadata.annotations, undefined, agoTime)
                                }
                            </HeaderDescription>
                        </HeaderTitleArea>
                    </CustomHeader>
                    <CardContent className="service-full-details-table">
                        {this._getServiceDetailsCardContent(item)}
                    </CardContent>
                </CustomCard >
            );
        }

        return null;
    }

    private _getServiceDetailsCardContent(item: IServiceItem): JSX.Element {
        let serviceDetails: any[] = [];
        serviceDetails.push({ key: Resources.TypeText, value: item.type });
        serviceDetails.push({ key: Resources.ClusterIPText, value: item.clusterIP || "-" });
        serviceDetails.push({ key: Resources.ExternalIPText, value: item.externalIP });
        serviceDetails.push({ key: Resources.PortText, value: item.port });
        serviceDetails.push({ key: Resources.SessionAffinityText, value: item.service && item.service.spec && item.service.spec.sessionAffinity || "" });
        serviceDetails.push({ key: Resources.SelectorText, value: item.service ? item.service.spec.selector : {} });
        serviceDetails.push({ key: Resources.LabelsText, value: item.service ? item.service.metadata.labels : {} });

        return (
            <div className="flex-row service-card-content">
                {
                    serviceDetails.map((data, index) => this._renderServiceCellContent(data, index))
                }
            </div>
        );
    }

    private _renderServiceCellContent(data: any, index: number): JSX.Element | undefined {
        const { key, value } = data;
        let className = `flex-column body-m ${index > 0 ? "service-column-padding" : ""}`;
        const getColumnKey = (keyText?: string, keyClassName?: string) => {
            const computedCLassName = `secondary-text service-column-key-padding ${keyClassName || ""}`;
            return <div className={computedCLassName}>{keyText}</div>;
        };

        switch (key) {
            case Resources.TypeText:
            case Resources.ClusterIPText:
            case Resources.PortText:
            case Resources.SessionAffinityText:
                className = `${className} service-basic-column-size`;
                return (
                    <div className={className} key={index}>
                        {getColumnKey(key)}
                        {defaultColumnRenderer(value)}
                    </div>
                );

            case Resources.ExternalIPText:
                return (
                    <div className="body-m service-column-padding" key={index}>
                        {getColumnKey(key, "service-extip-column-size")}
                        {renderExternalIpWithCopy(value, this.state.copyTooltipText, this._setCopiedRowIndex)}
                    </div>
                );

            case Resources.LabelsText:
            case Resources.SelectorText:
                return (
                    <div className="flex-grow flex-column service-column-padding" key={index}>
                        {getColumnKey(key, "body-m")}
                        {/* temporary fix for the overflow fade */}
                        <Tags className="overflow-fade service-tags-column-size" items={value} />
                    </div>
                );

            default:
                return undefined;
        }
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
            setTimeout(this._markTTI, 0);
            return KubeZeroData.getServiceAssociatedPodsZeroData();
        }

        return (
            <PodsTable
                contentClassName="service-pods-table"
                podsToRender={this.state.pods}
                headingText={Resources.AssociatedPodsText}
                onItemActivated={this._onSelectedPodInvoked}
                showWorkloadColumn={true}
                markTTICallback={this._markTTI}
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

    private _setCopiedRowIndex = (copiedRowIndex: number): void => {
        this.setState({
            copyTooltipText: copiedRowIndex === 0 ? Resources.CopiedExternalIp : Resources.CopyExternalIp
        }, () => {
            copiedRowIndex === 0 && Utils_Accessibility.announce(Resources.CopiedExternalIp);
        });
    }

    private _isTTIMarked: boolean = false;
    private _servicesStore: ServicesStore;
    private _podsActionsCreator: PodsActionsCreator;
}
