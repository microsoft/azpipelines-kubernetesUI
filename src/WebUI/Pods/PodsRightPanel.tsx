/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps, Statuses } from "azure-devops-ui/Status";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import * as React from "react";
import { PageTopHeader } from "../Common/PageTopHeader";
import { PodsRightPanelTabsKeys } from "../Constants";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { PodOverview } from "./PodOverview";
import { PodYaml } from "./PodYaml";

export interface IPodRightPanelProps extends IVssComponentProperties {
    pod: V1Pod;
    podStatusProps?: IStatusProps,
    statusTooltip?: string,
}

export interface IPodsRightPanelState {
    selectedTab: string;
}

export class PodsRightPanel extends BaseComponent<IPodRightPanelProps, IPodsRightPanelState> {
    constructor(props: IPodRightPanelProps) {
        super(props, {});
        this.state = {
            selectedTab: ""
        };
    }

    public render(): JSX.Element {
        return (
            <Page className="pods-right-panel-container flex flex-grow">
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
                <div className="pod-details-right-content page-content page-content-top">
                    {this._getPageContent()}
                </div>
            </Page>
        );
    }

    private _getHeader(): JSX.Element | null {
        return (
            <PageTopHeader
                title={(this.props.pod.metadata && this.props.pod.metadata.name) || ""}
                statusProps={this.props.podStatusProps}
                statusTooltip={this.props.statusTooltip}
                className={"pod-right-panel-header"}
            />
        );
    }

    private _onSelectedTabChanged = (selectedTab: string): void => {
        this.setState({
            selectedTab: selectedTab
        });
    }

    private _getPageContent(): React.ReactNode {
        const { statusProps, tooltip } = Utils.generatePodStatusProps(this.props.pod.status);
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

    private _getSelectedTabContent(): React.ReactNode {
        const selectedTab = this.state.selectedTab;
        switch (selectedTab) {
            case PodsRightPanelTabsKeys.PodsLogsKey:
                return <span>{"Pods Logs View coming soon..."}</span>;

            case PodsRightPanelTabsKeys.PodsYamlKey:
                return <PodYaml key={this.props.pod.metadata.uid} pod={this.props.pod} />;

            default:
                return <PodOverview key={this.props.pod.metadata.uid} pod={this.props.pod} />;
        }
    }
}
