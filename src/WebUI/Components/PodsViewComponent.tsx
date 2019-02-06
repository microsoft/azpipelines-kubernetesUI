/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1PodList, V1ObjectMeta, V1PodTemplateSpec } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { PodsLeftPanel } from "./PodsLeftPanel";
import { PodsRightPanel } from "./PodsRightPanel";
import "./PodsViewComponent.scss";

export interface IPodsViewComponentProperties extends IVssComponentProperties {
    parentMetaData: V1ObjectMeta;
    podsPromise: Promise<V1PodList>;
    podTemplate: V1PodTemplateSpec;
    parentKind: string;
    podLogs?: (itemName: string) => Promise<any>;
    podSSHConfig?: () => Promise<string>;
}

export interface IPodsViewComponentState {
    pods: V1Pod[];
    selectedPod: V1Pod | null;
}

export class PodsViewComponent extends BaseComponent<IPodsViewComponentProperties, IPodsViewComponentState> {
    constructor(props: IPodsViewComponentProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null
        };
    }

    public render(): JSX.Element {
        let selectedPod = this.state.selectedPod;
        if (!selectedPod && this.state.pods && this.state.pods.length > 0) {
            selectedPod = this.state.pods[0];
        }

        const leftPanel = (
            <PodsLeftPanel
                parentMetaData={this.props.parentMetaData}
                podTemplate={this.props.podTemplate}
                parentKind={this.props.parentKind}
                pods={this.state.pods}
                onSelectionChange={this._onPodSelectionChange} />
        );

        const rightPanel = (selectedPod ?
            <PodsRightPanel
                pod={selectedPod}
                podLogs={this.props.podLogs}
                podSSHConfig={this.props.podSSHConfig}
            />
            : <div className="zero-pods-text-container">{Resources.NoPodsFoundText}</div>);

        return (
            <Splitter
                fixedElement={SplitterElementPosition.Near}
                initialFixedSize={this._initialFixedSize}
                onRenderFarElement={() => rightPanel}
                onRenderNearElement={() => leftPanel}
            />);
    }

    public componentDidMount(): void {
        this._updatePodsIfNeeded();
    }

    private _updatePodsIfNeeded(): void {
        if (this.props.parentMetaData && this.props.podsPromise && !this._havePodsUpdated) {
            this._havePodsUpdated = true;
            this.props.podsPromise.then((podList: V1PodList) => {
                let pods: V1Pod[] = (podList && podList.items || []).filter(pod => {
                    return Utils.isOwnerMatched(pod.metadata, this.props.parentMetaData.uid);
                });

                this.setState({
                    pods: pods,
                    selectedPod: pods[0]
                });
            });
        }
    }

    private _onPodSelectionChange = (event: React.SyntheticEvent<HTMLElement>, selectedPod: V1Pod): void => {
        this.setState({
            selectedPod: selectedPod
        });
    }

    private _havePodsUpdated: boolean = false;
    private _initialFixedSize: number = 320;
}