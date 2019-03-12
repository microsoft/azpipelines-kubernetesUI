/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { TabBar, TabSize, Tab } from "azure-devops-ui/Tabs";
import * as React from "react";
import * as Resources from "../Resources";
import { PodsRightPanelTabsKeys } from "../Constants";
import { IVssComponentProperties } from "../Types";
import "./PodsRightPanel.scss";
import { PodOverview } from "./PodOverview";
import { Header, IHeaderProps, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";

export interface IPodRightPanelProps extends IVssComponentProperties {
    pod: V1Pod;
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
                    {this._getTabContent()}
                </div>
            </Page>
        );
    }

    private _getHeader(): JSX.Element | null {
        return (
            <Header
                title={(this.props.pod.metadata && this.props.pod.metadata.name) || ""}
                titleSize={TitleSize.Large}
                className={"pod-right-panel-header"}
            />);
    }

    private _onSelectedTabChanged = (selectedTab: string): void => {
        this.setState({
            selectedTab: selectedTab
        });
    }

    private _getTabContent(): React.ReactNode {
        const selectedTab = this.state.selectedTab;
        switch (selectedTab) {
            case PodsRightPanelTabsKeys.PodsLogsKey: return (
                <span>{"Pods Logs View coming soon..."}</span>
            );

            case PodsRightPanelTabsKeys.PodsYamlKey: return (
                <span>{"Pods YAML View coming soon..."}</span>
            );

            default: return (<PodOverview
                pod={this.props.pod}
            />);

        }
    }
}
