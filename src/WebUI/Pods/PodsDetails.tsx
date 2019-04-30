/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { Splitter, SplitterElementPosition } from "azure-devops-ui/Splitter";
import { createBrowserHistory, History } from "history";
import * as queryString from "query-string";
import * as React from "react";
import { IImageDetails } from "../../Contracts/Types";
import { KubeSummary } from "../Common/KubeSummary";
import { PodsEvents, PodsRightPanelTabsKeys, ImageDetailsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import * as Resources from "../Resources";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { IPodDetailsSelectionProperties, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { PodsActionsCreator } from "./PodsActionsCreator";
import { PodsLeftPanel } from "./PodsLeftPanel";
import { PodsRightPanel } from "./PodsRightPanel";
import { PodsStore } from "./PodsStore";
import { ImageDetailsActionsCreator } from "../ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";

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
    isLoading?: boolean;
    selectedPod: V1Pod | null | undefined;
    selectedImageDetails: IImageDetails | undefined;
    imageList?: string[];
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
        };

        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
        this._imageDetailsStore.addListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);

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
                    };
                }
            }

            return {};
        };

        if (!podsList || !podsList.items) {
            const podsActionCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);

            const storeEventName = props.serviceSelector ? PodsEvents.LabelledPodsFetchedEvent : PodsEvents.PodsFetchedEvent;
            const podsFetchHandler = () => {
                this._podsStore.removeListener(storeEventName, podsFetchHandler);
                const podsStoreState = this._podsStore.getState();
                const fetchedPodList = props.serviceSelector ? podsStoreState.podListByLabel[props.serviceSelector] : podsStoreState.podsList;
                if (fetchedPodList && fetchedPodList.items) {
                    const properties = getPodProperties(fetchedPodList.items);
                    const imageList = Utils.getImageIdsForPods(properties.pods || []);
                    // Adding breadcrumb when parent object is fetched on pod view refresh
                    notifyViewChanged(properties.parentName, properties.parentKind);
                    this.setState({
                        parentKind: properties.parentKind,
                        parentName: properties.parentName,
                        pods: properties.pods,
                        selectedPod: properties.selectedPod,
                        isLoading: podsStoreState.isLoading,
                        imageList: imageList
                    });
                }
            };

            this._podsStore.addListener(storeEventName, podsFetchHandler);
            if (props.serviceSelector) {
                podsActionCreator.getPods(KubeSummary.getKubeService(), props.serviceSelector, true);
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

        if (this.state.isLoading) {
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
                key={selectedPod.metadata.uid}
                pod={selectedPod}
                showImageDetails={this._showImageDetails} />
            : <div className="zero-pods-text-container">{Resources.NoPodsFoundText}</div>);

        return (
            <>
                {
                    leftPanel
                        ? (<Splitter
                            fixedElement={SplitterElementPosition.Near}
                            initialFixedSize={this._initialFixedSize}
                            minFixedSize={this._initialFixedSize}
                            onRenderFarElement={() => rightPanel}
                            onRenderNearElement={() => leftPanel}
                            nearElementClassName="pods-details-left-pane"
                        />)
                        : rightPanel
                }
            </>
        );
    }

    public componentDidUpdate(prevProps: IPodsDetailsProperties, prevState: IPodsDetailsState) {
        // Fetch hasImageDetailsData if we directly refresh and land on WorkloadDetails
        const imageService = KubeSummary.getImageService();
        if (imageService && this.state.imageList && this.state.imageList.length > 0) {
            const hasImageDetails: boolean | undefined = this._imageDetailsStore.hasImageDetails(this.state.imageList[0]);
            if (hasImageDetails === undefined) {
                ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator).setHasImageDetails(imageService, this.state.imageList);
            }
        }
    }

    public componentWillUnmount(): void {
        this._imageDetailsStore.removeListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
    }

    private _onPodSelectionChange = (event: React.SyntheticEvent<HTMLElement>, selectedPod: V1Pod, selectedView: string): void => {
        let routeValues: queryString.OutputParams = queryString.parse(this._history.location.search);
        routeValues["uid"] = selectedPod.metadata.uid;
        routeValues["view"] = selectedView || PodsRightPanelTabsKeys.PodsDetailsKey;

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

    private _setHasImageDetails = (): void => {
        this.setState({});
    }

    private _initialFixedSize: number = 320;
    private _history: History;
    private _podsStore: PodsStore;
    private _imageDetailsStore: ImageDetailsStore;
}