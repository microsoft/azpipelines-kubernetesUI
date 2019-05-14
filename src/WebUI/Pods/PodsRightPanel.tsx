/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Page } from "azure-devops-ui/Page";
import { Spinner } from "azure-devops-ui/Spinner";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { css } from "azure-devops-ui/Util";
import { createBrowserHistory, History } from "history";
import * as React from "react";
import * as queryString from "simple-query-string";
import { IImageDetails } from "../../Contracts/Types";
import * as Resources from "../../Resources";
import { PageTopHeader } from "../Common/PageTopHeader";
import { PodsEvents, PodsRightPanelTabsKeys } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { KubeFactory } from "../KubeFactory";
import { Utils } from "../Utils";
import { PodLog } from "./PodLog";
import { PodOverview } from "./PodOverview";
import { PodsActionsCreator } from "./PodsActionsCreator";
import "./PodsRightPanel.scss";
import { PodsStore } from "./PodsStore";
import { PodYaml } from "./PodYaml";
import { IPodRightPanelProps } from "./Types";

export interface IPodsRightPanelState {
    pod: V1Pod | undefined;
    podStatusProps?: IStatusProps;
    statusTooltip?: string;
    selectedTab: string;
    selectedImageDetails: IImageDetails | undefined;
    showImageDetails?: (imageId: string) => void;
}

export class PodsRightPanel extends React.Component<IPodRightPanelProps, IPodsRightPanelState> {
    constructor(props: IPodRightPanelProps) {
        super(props, {});

        this._historyService = createBrowserHistory();
        const queryParams = queryString.parse(this._historyService.location.search);

        let selectedPivot = PodsRightPanelTabsKeys.PodsDetailsKey;

        // If view is present, load corresponding tab
        if (queryParams && queryParams.view) {
            selectedPivot = queryParams.view as PodsRightPanelTabsKeys;
        }

        if (!props.pod && props.podUid) {
            // This case will only occur when opening orphaned pods
            const podsActionCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);
            const podsStore = StoreManager.GetStore<PodsStore>(PodsStore);
            const onPodsFetched = () => {
                const podList = podsStore.getState().podsList;
                if (podList && podList.items) {
                    const pod = podList.items.find(i => i.metadata.uid === props.podUid);
                    if (pod) {
                        const { statusProps, tooltip } = Utils.generatePodStatusProps(pod.status);
                        this.setState({
                            pod: pod,
                            podStatusProps: statusProps,
                            statusTooltip: tooltip
                        });
                    }
                }

                podsStore.removeListener(PodsEvents.PodsFetchedEvent, onPodsFetched);
            };

            podsStore.addListener(PodsEvents.PodsFetchedEvent, onPodsFetched);
            podsActionCreator.getPods(KubeFactory.getKubeService());
        }

        this.state = {
            pod: props.pod,
            podStatusProps: props.podStatusProps,
            statusTooltip: props.statusTooltip,
            selectedTab: selectedPivot,
            selectedImageDetails: undefined,
            showImageDetails: (imageId: string) => {
                const imageService = KubeFactory.getImageService();
                imageService && imageService.getImageDetails(imageId).then(imageDetails => {
                    this.setState({
                        selectedImageDetails: imageDetails
                    });
                });
            }
        };
    }

    public render(): JSX.Element {
        if (this.state.selectedImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

        return this._showPodDetails();
    }

    private _showPodDetails(): JSX.Element {
        return (
            this.state.pod ? (
                <Page className="pods-right-panel-container pod-overview-full-size flex flex-grow">
                    {this._getHeader()}
                    <TabBar
                        className={"pods-right-tab-bar"}
                        selectedTabId={this.state.selectedTab || PodsRightPanelTabsKeys.PodsDetailsKey}
                        onSelectedTabChanged={this._onSelectedTabChanged}
                        tabSize={TabSize.Tall}
                    >
                        <Tab
                            name={Resources.OverviewText}
                            id={PodsRightPanelTabsKeys.PodsDetailsKey}
                        />
                        <Tab
                            name={Resources.LogsText}
                            id={PodsRightPanelTabsKeys.PodsLogsKey}
                        />
                        <Tab
                            name={Resources.YamlText}
                            id={PodsRightPanelTabsKeys.PodsYamlKey}
                        />
                    </TabBar>
                    <div className="pod-details-right-content pod-overview-full-size page-content page-content-top">
                        {this._getPageContent()}
                    </div>
                </Page>)
                : <Spinner className={"flex-grow flex-center"} label={Resources.LoadingText} />
        );
    }

    private _getHeader(): JSX.Element | null {
        return (<PageTopHeader
            title={(this.state.pod!.metadata && this.state.pod!.metadata.name) || ""}
            statusProps={this.state.podStatusProps}
            statusTooltip={this.state.statusTooltip}
            className={"pod-right-panel-header"}
        />);
    }

    private _onSelectedTabChanged = (selectedTab: string): void => {
        let routeValues = { ...queryString.parse(this._historyService.location.search) };
        routeValues["view"] = selectedTab;

        this._historyService.replace({
            pathname: this._historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });

        this.setState({
            selectedTab: selectedTab
        });
        this.props.notifyTabChange && this.props.notifyTabChange();
    }

    private _getPageContent(): React.ReactNode {
        if (this.state.pod) {
            const { statusProps, tooltip } = Utils.generatePodStatusProps(this.state.pod.status);
            const podErrorMessage: string = statusProps !== Statuses.Success ? tooltip : "";
            const mainContentClass = this._getMainContentClassName(!!podErrorMessage);
            return (
                <>
                    {podErrorMessage && <MessageCard severity={MessageCardSeverity.Error}>{podErrorMessage}</MessageCard>}
                    <div className={css(podErrorMessage ? "page-content-top" : "", mainContentClass)}>
                        {this._getSelectedTabContent()}
                    </div>
                </>
            );
        }
    }

    private _getSelectedTabContent(): React.ReactNode {
        if (this.state.pod) {
            const componentProps = { key: this.state.pod.metadata.uid, pod: this.state.pod };
            switch (this.state.selectedTab) {
                case PodsRightPanelTabsKeys.PodsLogsKey:
                    return <PodLog {...componentProps} markTTICallback={this.props.markTTICallback} />;

                case PodsRightPanelTabsKeys.PodsYamlKey:
                    return <PodYaml {...componentProps} markTTICallback={this.props.markTTICallback} />;

                default:
                    // For OrphanPod, the imageDetails view show/hide state is controlled via Right panel itself,
                    // unlike other PodDetails views where the parent controls the show/hide of image details
                    const imageDetails = this.props.showImageDetails || this.state.showImageDetails;
                    return <PodOverview {...componentProps} showImageDetails={imageDetails} markTTICallback={this.props.markTTICallback} />;
            }
        }
    }

    private _getMainContentClassName(hasMessageCard?: boolean): string {
        // required to adjust the card size based on error message card in the pod overview.
        if (this.state.selectedTab === PodsRightPanelTabsKeys.PodsDetailsKey) {
            return "";
        }

        return css("full-size", hasMessageCard ? "pod-overview-error-height" : "pod-overview-content-full-size");
    }

    private _hideImageDetails = () => {
        this.setState({
            selectedImageDetails: undefined
        });
    }

    private _historyService: History;
}
