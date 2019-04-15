/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as queryString from "query-string";
import { V1Pod, V1PodList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { css } from "azure-devops-ui/Util";
import { createBrowserHistory, History } from "history";
import * as React from "react";
import { IImageDetails } from "../../Contracts/Types";
import { KubeSummary } from "../Common/KubeSummary";
import { PageTopHeader } from "../Common/PageTopHeader";
import { PodsRightPanelTabsKeys, PodsEvents } from "../Constants";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { PodLog } from "./PodLog";
import { PodOverview } from "./PodOverview";
import "./PodsRightPanel.scss";
import { PodYaml } from "./PodYaml";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { PodsActionsCreator } from "./PodsActionsCreator";
import { StoreManager } from "../FluxCommon/StoreManager";
import { PodsStore } from "./PodsStore";
import { Spinner } from "azure-devops-ui/Spinner";

export interface IPodRightPanelProps extends IVssComponentProperties {
    pod: V1Pod | undefined;
    podUid?: string;
    podStatusProps?: IStatusProps,
    statusTooltip?: string,
    showImageDetails?: (imageId: string) => void;
}

export interface IPodsRightPanelState {
    pod: V1Pod | undefined
    podStatusProps?: IStatusProps,
    statusTooltip?: string,
    selectedTab: string;
    selectedImageDetails: IImageDetails | undefined;
    showImageDetails?: (imageId: string) => void;
}

export class PodsRightPanel extends BaseComponent<IPodRightPanelProps, IPodsRightPanelState> {
    constructor(props: IPodRightPanelProps) {
        super(props, {});

        this._historyService = createBrowserHistory();
        const queryParams = queryString.parse(this._historyService.location.search)

        let selectedPivot = PodsRightPanelTabsKeys.PodsDetailsKey;

        // If view is present, load corresponding tab
        if (!!queryParams.view) {
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
            }

            podsStore.addListener(PodsEvents.PodsFetchedEvent, onPodsFetched);
            podsActionCreator.getPods(KubeSummary.getKubeService());
        }

        this.state = {
            pod: props.pod,
            podStatusProps: props.podStatusProps,
            statusTooltip: props.statusTooltip,
            selectedTab: selectedPivot,
            selectedImageDetails: undefined,
            showImageDetails: (imageId: string) => {
                const imageService = KubeSummary.getImageService();
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
        return this.state.pod ? (
            <PageTopHeader
                title={(this.state.pod.metadata && this.state.pod.metadata.name) || ""}
                statusProps={this.state.podStatusProps}
                statusTooltip={this.state.statusTooltip}
                className={"pod-right-panel-header"}
            />
        ) : null;
    }

    private _onSelectedTabChanged = (selectedTab: string): void => {
        let routeValues: queryString.OutputParams = queryString.parse(this._historyService.location.search);
        routeValues["view"] = selectedTab;

        this._historyService.replace({
            pathname: this._historyService.location.pathname,
            search: queryString.stringify(routeValues)
        });

        this.setState({
            selectedTab: selectedTab
        });
    }

    private _getPageContent(): React.ReactNode {
        if (this.state.pod) {
            const { statusProps, tooltip } = Utils.generatePodStatusProps(this.state.pod.status);
            const podErrorMessage: string = statusProps !== Statuses.Success ? tooltip : "";
            return (
                <>
                    {podErrorMessage && <MessageCard severity={MessageCardSeverity.Error}>{podErrorMessage}</MessageCard>}
                    <div className={podErrorMessage ? "page-content-top" : ""}>
                        {this._getSelectedTabContent()}
                    </div>
                </>
            );
        }
    }

    private _getSelectedTabContent(): React.ReactNode {
        if (this.state.pod) {
            const selectedTab = this.state.selectedTab;
            // For OrphanPod, the imageDetails view show/hide state is controlled via Right panel itself,
            // unlike other PodDetails views where the parent controls the show/hide of image details
            const showImageDetails = this.props.showImageDetails || this.state.showImageDetails;
            switch (selectedTab) {
                case PodsRightPanelTabsKeys.PodsLogsKey:
                    return <PodLog key={this.state.pod.metadata.uid} pod={this.state.pod} />;

                case PodsRightPanelTabsKeys.PodsYamlKey:
                    return <PodYaml key={this.state.pod.metadata.uid} pod={this.state.pod} />;

                default:
                    return <PodOverview key={this.state.pod.metadata.uid} pod={this.state.pod} showImageDetails={showImageDetails} />;
            }
        }
    }

    private _getMainContentClassName(hasMessageCard?: boolean): string {
        // required to adjust the card size based on error message card in the pod overview.
        if (this.state.selectedTab === PodsRightPanelTabsKeys.PodsDetailsKey) {
            return "";
        }

        return css("full-size", hasMessageCard ? "pod-overview-error-height" : "pod-overview-full-size");
    }

    private _hideImageDetails = () => {
        this.setState({
            selectedImageDetails: undefined
        });
    }

    private _historyService: History;
}
