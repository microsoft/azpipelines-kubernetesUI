/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { PodsLeftPanel } from "./PodsLeftPanel";
import { PodsRightPanel } from "./PodsRightPanel";

export interface IPodsDetailsProperties extends IVssComponentProperties {
    pods: V1Pod[];
    parentName: string;
    selectedPod?: V1Pod;
    parentKind: string;
    onBackButtonClick?: () => void;
}

export interface IPodsDetailsState {
    selectedPod: V1Pod | null;
}

export class PodsDetails extends BaseComponent<IPodsDetailsProperties, IPodsDetailsState> {
    constructor(props: IPodsDetailsProperties) {
        super(props, {});
        this.state = {
            selectedPod: this.props.selectedPod || null
        };
    }

    public render(): JSX.Element {
        let selectedPod = this.state.selectedPod;
        if (!selectedPod && this.props.pods && this.props.pods.length > 0) {
            selectedPod = this.props.pods[0];
        }

        const leftPanel = (
            <PodsLeftPanel
                pods={this.props.pods}
                parentName={this.props.parentName}
                parentKind={this.props.parentKind}
                selectedPodName={selectedPod ? selectedPod.metadata.name : ""}
                onSelectionChange={this._onPodSelectionChange}
                onBackButtonClick={this.props.onBackButtonClick} />
        );

        const rightPanel = (selectedPod ?
            <PodsRightPanel
                pod={selectedPod} />
            : <div className="zero-pods-text-container">{Resources.NoPodsFoundText}</div>);

        return (
            <Splitter
                fixedElement={SplitterElementPosition.Near}
                initialFixedSize={this._initialFixedSize}
                minFixedSize={this._initialFixedSize}
                onRenderFarElement={() => rightPanel}
                onRenderNearElement={() => leftPanel}
                nearElementClassName="pods-details-left-pane"
            />);
    }


    private _onPodSelectionChange = (event: React.SyntheticEvent<HTMLElement>, selectedPod: V1Pod): void => {
        this.setState({
            selectedPod: selectedPod
        });
    }

    private _initialFixedSize: number = 320;
}