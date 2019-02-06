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
import { PodDetailsView } from "./PodDetailsView";
import { TerminalHandler } from "../../Contracts/TerminalService";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import "./xterm.css";

export interface IPodRightPanelProps extends IVssComponentProperties {
    pod: V1Pod;
    podLogs?: (itemName: string) => Promise<any>;
    podSSHConfig?: () => Promise<string>;
}

export interface IPodsRightPanelState {
    selectedTab: string;
    termSvc?: TerminalHandler;
    terminalOpen: boolean;
}

export class PodsRightPanel extends BaseComponent<IPodRightPanelProps, IPodsRightPanelState> {
    private termElm: HTMLDivElement | null = null;
    constructor(props: IPodRightPanelProps) {
        super(props, {});
        this.state = {
            selectedTab: "",
            terminalOpen: false
        };
    }

    public render(): JSX.Element {
        return (
            <div className="pods-right-panel-container">
                <TabBar
                    className={"pods-right-tab-bar"}
                    selectedTabId={this.state.selectedTab || PodsRightPanelTabsKeys.PodsDetailsKey}
                    onSelectedTabChanged={this._onSelectedTabChanged}
                    tabSize={TabSize.Tall}
                >

                    <Tab
                        name={Resources.DetailsText}
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

                    <Tab
                        name={Resources.SSHText}
                        id={PodsRightPanelTabsKeys.PodsSSHKey}
                    />
                </TabBar>

                <div className="pods-right-tab-content flex-column flex-grow">
                    {this._getTabContent()}
                </div>
            </div>
        );
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

            case PodsRightPanelTabsKeys.PodsSSHKey: {
                return (
                    <div id="pod-ssh-placeholder" ref={ref => this.termElm = ref} >
                        <ConditionalChildren renderChildren={new ObservableValue(!this.state.terminalOpen)}>
                            <Button primary={true} text="Open SSH" onClick={(event) => {
                                console.log("this buttonn is clicked with term ref " + this.termElm);
                                this.generateTSforPod();
                            }}/>
                        </ConditionalChildren>
                    </div>
                );
            }

            default: return (<PodDetailsView
                pod={this.props.pod}
            />);

        }
    }

    private generateTSforPod() {
        this.props.podSSHConfig && this.props.podSSHConfig().then(config => {
            console.log(config);
            this.setState({
                termSvc: new TerminalHandler(config, this.termElm, (status) => this.terminalOpen(status))
            });
            if (this.props.pod && this.props.pod.metadata.name && this.state.termSvc) {
                console.log("term service found and attempting to open a pod")
                this.state.termSvc.generateTTYForPod(this.props.pod.metadata.name, this.props.pod.spec.containers[0].name); // always sshing to first container
            }
        });
    }

    private terminalOpen( status: boolean) {
        this.setState({
            terminalOpen: status
        })
    }
}
