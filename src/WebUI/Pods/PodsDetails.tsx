/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { SplitterElementPosition, Splitter } from "azure-devops-ui/Splitter";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties, IPodDetailsSelectionProperties } from "../Types";
import { PodsLeftPanel } from "./PodsLeftPanel";
import { PodsRightPanel } from "./PodsRightPanel";
import { KubeSummary } from "../Common/KubeSummary";
import { IImageDetails } from "../../Contracts/Types";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { PodsStore } from "./PodsStore";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { PodsActionsCreator } from "./PodsActionsCreator";
import { PodsEvents } from "../Constants";
import { Utils } from "../Utils";
import { History, createBrowserHistory } from "history";
import * as queryString from "query-string";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";

export interface IPodsDetailsProperties extends IVssComponentProperties {
    parentUid: string;
    serviceSelector?: string;
    serviceName?: string;
    selectedPodUid?: string;
    notifyViewChanged?: (viewTree: { id: string, displayName: string, url: string }[]) => void;
}

export interface IPodsDetailsState {
    pods?: V1Pod[];
    parentName?: string;
    parentKind?: string;
    podsLoading?: boolean;
    selectedPod: V1Pod | null | undefined;
    selectedImageDetails: IImageDetails | undefined;
}

export class PodsDetails extends BaseComponent<IPodsDetailsProperties, IPodsDetailsState> {
    constructor(props: IPodsDetailsProperties) {
        super(props);
        this._history = createBrowserHistory();

        const notifyViewChanged = (parentName: string | undefined, parentKind: string | undefined) => {
            // In pod details, we show all pods in the parent. So the view owner is the parent, not the pod
            if (parentName && parentKind && props.notifyViewChanged) {
                const clonedQueryParams = { ...queryString.parse(this._history.location.search) };
                delete clonedQueryParams["parentUid"];
                delete clonedQueryParams["serviceSelector"];
                delete clonedQueryParams["serviceName"];
                const itemTypeKey = Utils.getItemTypeKeyFromKind(parentKind);
                clonedQueryParams["type"] = itemTypeKey;
                clonedQueryParams["uid"] = props.parentUid;
                const paramsString = queryString.stringify(clonedQueryParams);
                const url = this._history.location.pathname + "?" + paramsString;

                props.notifyViewChanged([{
                    id: itemTypeKey + props.parentUid,
                    displayName: parentName,
                    url: url
                }]);
            }
        }

        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);
        let parentKind: string | undefined = undefined, parentName: string | undefined = undefined, filteredPods: V1Pod[] | undefined = [], selectedPod: V1Pod | undefined = undefined;
        const podsList = props.serviceSelector ? this._podsStore.getState().podListByLabel[props.serviceSelector] : this._podsStore.getState().podsList;

        const getPodProperties = (pods: V1Pod[]): { parentKind?: string, parentName?: string, pods?: V1Pod[], selectedPod?: V1Pod } => {
            if (pods) {
                const filteredPods = props.serviceSelector
                    ? pods
                    : pods.filter(p => Utils.isOwnerMatched(p.metadata, props.parentUid!.toLowerCase()));

                if (filteredPods.length) {
                    const selectedPod = props.selectedPodUid ? filteredPods.find(p => p.metadata.uid.toLowerCase() === props.selectedPodUid!.toLowerCase()) : filteredPods[0];
                    let parentKind: string | undefined = undefined;
                    let parentName: string | undefined = undefined;

                    if (props.serviceName && props.serviceSelector) {
                        parentName = props.serviceName;
                        parentKind = "Service";
                    } else {
                        const parent = filteredPods[0].metadata.ownerReferences.find(o => o.uid.toLowerCase() === props.parentUid!.toLowerCase());
                        if (parent) {
                            parentKind = parent.kind;
                            parentName = parent.name;
                        }
                    }

                    return {
                        parentKind: parentKind,
                        parentName: parentName,
                        pods: filteredPods,
                        selectedPod: selectedPod
                    }
                }
            }

            return {};
        }

        if (!podsList || !podsList.items) {
            const podsActionCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);

            const storeEventName = props.serviceSelector ? PodsEvents.LabelledPodsFetchedEvent : PodsEvents.PodsFetchedEvent;
            const podsFetchHandler = () => {
                this._podsStore.removeListener(storeEventName, podsFetchHandler);
                const podsStoreState = this._podsStore.getState();
                const fetchedPodList = props.serviceSelector ? podsStoreState.podListByLabel[props.serviceSelector] : podsStoreState.podsList;
                if (fetchedPodList && fetchedPodList.items) {
                    const properties = getPodProperties(fetchedPodList.items);
                    this.setState({
                        parentKind: properties.parentKind,
                        parentName: properties.parentName,
                        pods: properties.pods,
                        selectedPod: properties.selectedPod,
                        podsLoading: podsStoreState.podsLoading
                    });
                }
            }

            this._podsStore.addListener(storeEventName, podsFetchHandler);
            if (props.serviceSelector) {
                podsActionCreator.getPods(KubeSummary.getKubeService(), props.serviceSelector);
            }
            else {
                podsActionCreator.getPods(KubeSummary.getKubeService());
            }
        }
        else {
            const properties = getPodProperties(podsList.items);
            parentKind = properties.parentKind;
            parentName = properties.parentName;
            filteredPods = properties.pods;
            selectedPod = properties.selectedPod;
        }

        notifyViewChanged(parentName, parentKind);
        this.state = {
            parentKind: parentKind,
            parentName: parentName,
            pods: filteredPods,
            selectedPod: selectedPod,
            selectedImageDetails: undefined
        };
    }

    public render(): JSX.Element {
        if (this.state.selectedImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

        if (this.state.podsLoading) {
            return <Spinner className={"flex flex-grow loading-pods"}
                size={SpinnerSize.large}
                label={Resources.LoadingPodsSpinnerLabel} />;
        }

        let selectedPod = this.state.selectedPod;
        if (!selectedPod && this.state.pods && this.state.pods.length > 0) {
            selectedPod = this.state.pods[0];
        }

        const leftPanel = this.state.pods ? (
            <PodsLeftPanel
                pods={this.state.pods}
                parentName={this.state.parentName || ""}
                parentKind={this.state.parentKind || ""}
                selectedPodName={selectedPod ? selectedPod.metadata.name : ""}
                onSelectionChange={this._onPodSelectionChange}
                onBackButtonClick={this._onParentBackButtonClick} />
        ) : undefined;

        const rightPanel = (selectedPod ?
            <PodsRightPanel
                pod={selectedPod}
                showImageDetails={this._showImageDetails} />
            : <div className="zero-pods-text-container">{Resources.NoPodsFoundText}</div>);

        return (
            <>
            {
                leftPanel
                    ?(<Splitter
                            fixedElement= { SplitterElementPosition.Near }
        initialFixedSize = { this._initialFixedSize }
        minFixedSize = { this._initialFixedSize }
        onRenderFarElement = {() => rightPanel
    }
    onRenderNearElement = {() => leftPanel
}
nearElementClassName = "pods-details-left-pane"
    />)
                        : rightPanel
                }
            </>
        );
    }

    private _onPodSelectionChange = (event: React.SyntheticEvent<HTMLElement>, selectedPod: V1Pod): void => {
    let routeValues: queryString.OutputParams = queryString.parse(this._history.location.search);
    routeValues["uid"] = selectedPod.metadata.uid;

    this._history.replace({
        pathname: this._history.location.pathname,
        search: queryString.stringify(routeValues)
    });


    this.setState({
        selectedPod: selectedPod
    });
}

    private _onParentBackButtonClick = () => {
    const selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
    selectionActionCreator.selectItem({
        itemUID: this.props.parentUid,
        selectedItemType: Utils.getItemTypeKeyFromKind(this.state.parentKind || ""),
        showSelectedItem: true,
        item: undefined,
        properties: { parentUid: "", serviceSelector: "", serviceName: "" } as IPodDetailsSelectionProperties // This will delete these values if they are present in the url
    })
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
    private _history: History;
    private _podsStore: PodsStore;
}