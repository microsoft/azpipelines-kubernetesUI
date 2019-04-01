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
import { KubeSummary } from "../Common/KubeSummary";
import { IImageDetails } from "../../Contracts/Types";
import { ImageDetails } from "../ImageDetails/ImageDetails";

export interface IPodsDetailsProperties extends IVssComponentProperties {
    pods: V1Pod[];
    parentName: string;
    selectedPod?: V1Pod;
    parentKind: string;
    onBackButtonClick?: () => void;
}

export interface IPodsDetailsState {
    selectedPod: V1Pod | null;
    selectedImageDetails: IImageDetails | undefined;
}

export class PodsDetails extends BaseComponent<IPodsDetailsProperties, IPodsDetailsState> {
    constructor(props: IPodsDetailsProperties) {
        super(props, {});
        this.state = {
            selectedPod: this.props.selectedPod || null,
            selectedImageDetails: undefined
        };
    }

    public render(): JSX.Element {
        if (this.state.selectedImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

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
                pod={selectedPod}
                showImageDetails={this._showImageDetails} />
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

    // ToDO:: Handle GetImageDetails via ImageStore to avoid multiple calls to API from UI
    private _showImageDetails = (imageId: string) => {
        const imageService = KubeSummary.getImageService();
        imageService && imageService.getImageDetails(imageId).then(imageDetails => {
            this.setState({
                selectedImageDetails: imageDetails
            });
        });
    }

    private _hideImageDetails = () => {
        this.setState({
            selectedImageDetails: undefined
        });
    }

    private _initialFixedSize: number = 320;
}