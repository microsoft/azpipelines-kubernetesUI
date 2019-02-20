/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod, V1ObjectMeta, V1PodTemplateSpec } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { PodsLeftPanel } from "../Pods/PodsLeftPanel";
import { PodsRightPanel } from "../Pods/PodsRightPanel";
import "./WorkloadPodsView.scss";
import { PodsStore } from "../Pods/PodsStore";
import { StoreManager } from "../FluxCommon/StoreManager";

export interface IWorkloadPodsViewProperties extends IVssComponentProperties {
    parentMetaData: V1ObjectMeta;
    podTemplate: V1PodTemplateSpec;
    parentKind: string;
}

export interface IWorkloadPodsViewState {
    pods: V1Pod[];
    selectedPod: V1Pod | null;
}

export class WorkloadPodsView extends BaseComponent<IWorkloadPodsViewProperties, IWorkloadPodsViewState> {
    constructor(props: IWorkloadPodsViewProperties) {
        super(props, {});
        this.state = {
            pods: [],
            selectedPod: null
        };
        this._store = StoreManager.GetStore<PodsStore>(PodsStore);
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
                pod={selectedPod} />
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
        const podList = this._store.getState().podsList;
        let pods: V1Pod[] = (podList && podList.items || []).filter(pod => {
            return Utils.isOwnerMatched(pod.metadata, this.props.parentMetaData.uid);
        });

        this.setState({
            pods: pods,
            selectedPod: pods[0]
        });
    }

    private _onPodSelectionChange = (event: React.SyntheticEvent<HTMLElement>, selectedPod: V1Pod): void => {
        this.setState({
            selectedPod: selectedPod
        });
    }

    private _havePodsUpdated: boolean = false;
    private _initialFixedSize: number = 320;
    private _store: PodsStore;
}