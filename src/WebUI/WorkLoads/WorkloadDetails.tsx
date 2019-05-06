/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1DaemonSetList, V1LabelSelector, V1ObjectMeta, V1Pod, V1PodTemplateSpec, V1ReplicaSet, V1ReplicaSetList, V1StatefulSet, V1StatefulSetList } from "@kubernetes/client-node";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { Page } from "azure-devops-ui/Page";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { IStatusProps } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { createBrowserHistory } from "history";
import * as queryString from "query-string";
import * as React from "react";
import { IKubeService } from "../../Contracts/Contracts";
import { IImageDetails } from "../../Contracts/Types";
import { defaultColumnRenderer } from "../Common/KubeCardWithTable";
import { KubeSummary } from "../Common/KubeSummary";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { ImageDetailsEvents, PodsEvents, SelectedItemKeys, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { ImageDetailsActionsCreator } from "../ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsStore } from "../Pods/PodsStore";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { getRunDetailsText } from "../RunDetails";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { IPodDetailsSelectionProperties, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./WorkloadDetails.scss";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";

export interface IWorkloadDetailsProperties extends IVssComponentProperties {
    item?: V1ReplicaSet | V1DaemonSet | V1StatefulSet;
    parentKind: string;
    itemTypeKey: SelectedItemKeys;
    getStatusProps: (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet) => ({ statusProps: IStatusProps | undefined, podsTooltip: string });
    notifyViewChanged?: (viewTree: { id: string, displayName: string, url: string }[]) => void;
}

export interface IWorkloadDetailsState {
    item: V1ReplicaSet | V1DaemonSet | V1StatefulSet | undefined;
    pods: Array<V1Pod>;
    selectedPod: V1Pod | null;
    showSelectedPod: boolean;
    showImageDetails: boolean;
    selectedImageDetails: IImageDetails | undefined;
    arePodsLoading?: boolean;
    imageList?: string[];
}

export interface IWorkLoadDetailsItem {
    podTemplate: V1PodTemplateSpec;
    parentMetaData: V1ObjectMeta;
    selector: V1LabelSelector | undefined;
}

export class WorkloadDetails extends React.Component<IWorkloadDetailsProperties, IWorkloadDetailsState> {
    constructor(props: IWorkloadDetailsProperties) {
        super(props, {});
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);
        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);

        this._podsStore.addListener(PodsEvents.PodsFetchedEvent, this._onPodsUpdated);
        this._imageDetailsStore.addListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);

        this._workloadsStore = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);

        const notifyViewChanged = (item: V1ReplicaSet | V1DaemonSet | V1StatefulSet) => {
            if (item.metadata && props.notifyViewChanged) {
                const metadata = item.metadata;
                props.notifyViewChanged([{ id: props.itemTypeKey + metadata.uid, displayName: metadata.name, url: window.location.href }]);
            }
        }

        let item = props.item;
        if (!props.item) {
            const kubeService = KubeSummary.getKubeService();
            ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator).getPods(kubeService);
            const workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);

            const history = createBrowserHistory();
            const queryParams = queryString.parse(history.location.search);
            if (queryParams.type) {
                // function to make sure we get the item for the view if present, or we make a call and set up a store listener to fetch that item
                const getItem = (getItemList: () => (V1ReplicaSetList | V1StatefulSetList | V1DaemonSetList | undefined), actionCreatorFunc: (k: IKubeService) => void, storeEvent: string) => {

                    // function to search the relevant item from the item list provided
                    const searchItem = () => {
                        const itemList = getItemList();
                        if (itemList && itemList.items) {
                            return (itemList.items as { metadata: V1ObjectMeta }[]).find(i => i.metadata.uid === queryParams.uid)
                        }

                    }

                    let itemToReturn: any = searchItem();

                    if (!itemToReturn) {
                        const subscription = () => {
                            const item = searchItem();
                            this._workloadsStore.removeListener(storeEvent, subscription);

                            if (item) {
                                notifyViewChanged(item as any);
                            }
                            this.setState({ item: item as (V1ReplicaSet | V1DaemonSet | V1StatefulSet) });
                        }

                        actionCreatorFunc(kubeService);
                        this._workloadsStore.addListener(storeEvent, subscription)
                    }

                    return itemToReturn;
                }

                switch (queryParams.type) {
                    case SelectedItemKeys.ReplicaSetKey:
                        item = getItem(() => this._workloadsStore.getState().replicaSetList, (k) => workloadsActionCreator.getReplicaSets(k), WorkloadsEvents.ReplicaSetsFetchedEvent);
                        break;
                    case SelectedItemKeys.DaemonSetKey:
                        item = getItem(() => this._workloadsStore.getState().daemonSetList, (k) => workloadsActionCreator.getDaemonSets(k), WorkloadsEvents.DaemonSetsFetchedEvent);
                        break;
                    case SelectedItemKeys.StatefulSetKey:
                        item = getItem(() => this._workloadsStore.getState().statefulSetList, (k) => workloadsActionCreator.getStatefulSets(k), WorkloadsEvents.StatefulSetsFetchedEvent);
                        break;
                }
            }
        }

        if (item) {
            notifyViewChanged(item);
        }

        this.state = {
            item: item,
            pods: [],
            selectedPod: null,
            showSelectedPod: false,
            showImageDetails: false,
            selectedImageDetails: undefined
        };
    }

    public render(): JSX.Element {
        if (this.state.showImageDetails && this.state.selectedImageDetails) {
            return <ImageDetails
                imageDetails={this.state.selectedImageDetails}
                onBackButtonClick={this._hideImageDetails} />;
        }

        return (
            <Page className="workload-details-page flex flex-grow">
                {this._getMainHeading()}
                <div className="workload-details-page-content page-content page-content-top">
                    {this._getWorkloadDetails()}
                    {this._getAssociatedPods()}
                </div>
            </Page>
        );
    }

    public componentDidMount(): void {
        if (this.state.item) {
            const podList = this._podsStore.getState().podsList;
            const pods: V1Pod[] = (podList && podList.items || []).filter(pod => {
                return Utils.isOwnerMatched(pod.metadata, this.state.item!.metadata.uid);
            });

            this.setState({
                pods: pods,
                selectedPod: pods && pods.length > 0 ? pods[0] : null
            });
        }
    }

    public componentDidUpdate(prevProps: IWorkloadDetailsProperties, prevState: IWorkloadDetailsState) {
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
        this._podsStore.removeListener(PodsEvents.PodsFetchedEvent, this._onPodsUpdated);
        this._imageDetailsStore.removeListener(ImageDetailsEvents.HasImageDetailsEvent, this._setHasImageDetails);
    }

    private _getMainHeading(): JSX.Element | null {
        if (this.state.item) {
            const metadata = this.state.item.metadata;
            const { statusProps, podsTooltip } = this.props.getStatusProps(this.state.item);

            return !metadata ? null
                : <PageTopHeader title={metadata.name} statusProps={statusProps} statusTooltip={podsTooltip} />;
        }

        return null;
    }

    private _showImageDetails = (imageId: string) => {
        const imageService = KubeSummary.getImageService();
        imageService && imageService.getImageDetails(imageId).then(imageDetails => {
            this.setState({
                showImageDetails: true,
                selectedImageDetails: imageDetails
            });
        });
    }

    private _hideImageDetails = () => {
        this.setState({
            showImageDetails: false,
            selectedImageDetails: undefined
        });
    }

    private _onPodsUpdated = () => {
        const podsStoreState = this._podsStore.getState();
        const podList = podsStoreState.podsList;
        if (podList && podList.items) {
            const imageList = Utils.getImageIdsForPods(podList.items);
            this.setState({
                pods: podList.items.filter(p => this.state.item && Utils.isOwnerMatched(p.metadata, this.state.item.metadata.uid)),
                arePodsLoading: podsStoreState.isLoading,
                imageList: imageList
            });
        }
    }

    private _getWorkloadDetails(): JSX.Element | null {
        if (this.state.item) {
            const metadata = this.state.item.metadata;
            if (metadata) {
                const agoTime = Date_Utils.ago(new Date(metadata.creationTimestamp), Date_Utils.AgoFormat.Compact);

                return (
                    <CustomCard className="workload-details-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                        <CustomHeader>
                            <HeaderTitleArea>
                                <HeaderTitleRow>
                                    <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium} >
                                        {localeFormat(Resources.WorkloadDetails, this.props.parentKind)}
                                    </HeaderTitle>
                                </HeaderTitleRow>
                                <HeaderDescription className={"text-ellipsis"}>
                                    {
                                        getRunDetailsText(metadata.annotations, undefined, agoTime)
                                    }
                                </HeaderDescription>
                            </HeaderTitleArea>
                        </CustomHeader>
                        <CardContent className="workload-full-details-table">
                            {this._getWorkloadDetailsCardContent()}
                        </CardContent>
                    </CustomCard>
                );
            }
        }

        return null;
    }

    private _getWorkloadDetailsCardContent(): JSX.Element {
        let workloadDetails: any[] = [];
        if (this.state.item) {
            workloadDetails.push({ key: Resources.ImageText, value: this.state.item.spec && this.state.item.spec.template });
            workloadDetails.push({ key: Resources.SelectorText, value: this.state.item.spec && this.state.item.spec.selector && this.state.item.spec.selector.matchLabels || {} });
            workloadDetails.push({ key: Resources.LabelsText, value: this.state.item.metadata && this.state.item.metadata.labels || {} });
        }

        return (
            <div className="flex-row workload-card-content">
                {
                    workloadDetails.map((item, index) => this._renderWorkloadCellContent(item, index))
                }
            </div>
        );
    }

    private _renderWorkloadCellContent(item: any, index: number): JSX.Element | undefined {
        const { key, value } = item;
        const getColumnKey = (keyText?: string, keyClassName?: string) => (
            <div className={css(keyClassName || "", "secondary-text workload-column-key-padding")}>
                {keyText}
            </div>
        );

        switch (key) {
            case Resources.ImageText:
                return (
                    <div className="flex-column body-m workload-image-column-size" key={index}>
                        {getColumnKey(key)}
                        {this._renderImageCell(value)}
                    </div>
                );

            case Resources.LabelsText:
            case Resources.SelectorText:
                return (
                    <div className="flex-grow flex-column workload-tags-column-padding" key={index}>
                        {getColumnKey(key, "body-m")}
                        {/* temporary fix for the overflow fade */}
                        <Tags className="overflow-fade workload-tags-column-size" items={value} />
                    </div>
                );

            default:
                return undefined;
        }
    }

    private _renderImageCell(itemValue: any): JSX.Element {
        const imageId = Utils.getImageIdForWorkload(Utils.getFirstContainerName(itemValue.spec), this.state.pods);
        const { imageText, imageTooltipText } = Utils.getImageText(itemValue.spec);
        let imageDetailsUnavailableTooltipText: string = "";
        const hasImageDetails: boolean | undefined = this._imageDetailsStore.hasImageDetails(imageId);
        // if hasImageDetails is undefined, then image details promise has not resolved, so do not set imageDetailsUnavailable tooltip
        if (hasImageDetails === false) {
            const imageValueText = imageTooltipText || imageText;
            imageDetailsUnavailableTooltipText = localeFormat("{0} | {1}", imageValueText, Resources.ImageDetailsUnavailableText);
        }

        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly>
                <div className="flex-row flex-center">
                    <Link
                        className="fontSizeM font-size-m text-ellipsis bolt-table-link workload-image-padding"
                        rel={"noopener noreferrer"}
                        onClick={(e) => {
                            e.preventDefault();
                            this._showImageDetails(imageId);
                        }}
                    >
                        {imageText}
                    </Link>
                </div>
            </Tooltip>
            : defaultColumnRenderer(imageText, "", imageDetailsUnavailableTooltipText);

        return itemToRender as JSX.Element;
    }

    private _getAssociatedPods(): JSX.Element | null {
        const podsStoreState = this._podsStore.getState();
        if (podsStoreState.isLoading) {
            return <Spinner className={"flex flex-grow loading-pods"}
                size={SpinnerSize.large}
                label={Resources.LoadingPodsSpinnerLabel} />;
        }

        if (this.state.pods.length === 0) {
            return KubeZeroData.getWorkloadAssociatedPodsZeroData();
        }

        return (
            <PodsTable
                contentClassName="workload-pods-table"
                podsToRender={this.state.pods}
                headingText={Resources.PodsText}
                onItemActivated={this._onSelectedPodInvoked}
            />
        );
    }

    private _onSelectedPodInvoked = (event: React.SyntheticEvent<HTMLElement>, pod: V1Pod) => {
        const selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
        selectionActionCreator.selectItem(
            {
                item: undefined,
                itemUID: pod.metadata.uid,
                selectedItemType: SelectedItemKeys.PodDetailsKey,
                showSelectedItem: true,
                properties: {
                    parentUid: this.state.item!.metadata.uid,
                } as IPodDetailsSelectionProperties
            }
        );
    }

    private _setHasImageDetails = (): void => {
        this.setState({});
    }

    private _podsStore: PodsStore;
    private _workloadsStore: WorkloadsStore;
    private _imageDetailsStore: ImageDetailsStore;
}