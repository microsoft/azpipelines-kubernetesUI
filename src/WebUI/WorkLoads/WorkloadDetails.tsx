/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta, V1Pod, V1PodTemplateSpec, V1LabelSelector, V1ReplicaSet, V1DaemonSet, V1StatefulSet, V1ReplicaSetList, V1DaemonSetList, V1StatefulSetList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { IStatusProps } from "azure-devops-ui/Status";
import { ITableColumn, Table } from "azure-devops-ui/Table";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { Link } from "azure-devops-ui/Link";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IImageDetails } from "../../Contracts/Types";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { PageTopHeader } from "../Common/PageTopHeader";
import { Tags } from "../Common/Tags";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetails } from "../ImageDetails/ImageDetails";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { PodsStore } from "../Pods/PodsStore";
import { PodsTable } from "../Pods/PodsTable";
import * as Resources from "../Resources";
import { IVssComponentProperties, IPodDetailsSelectionProperties } from "../Types";
import { Utils, IMetadataAnnotationPipeline } from "../Utils";
import "./WorkloadDetails.scss";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { KubeSummary } from "../Common/KubeSummary";
import { getRunDetailsText } from "../RunDetails";
import { createBrowserHistory } from "history";
import * as queryString from "query-string";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { SelectedItemKeys, WorkloadsEvents, PodsEvents } from "../Constants";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsStore } from "./WorkloadsStore";
import { IKubeService } from "../../Contracts/Contracts";

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
}

export interface IWorkLoadDetailsItem {
    podTemplate: V1PodTemplateSpec;
    parentMetaData: V1ObjectMeta;
    selector: V1LabelSelector | undefined;
}

export class WorkloadDetails extends BaseComponent<IWorkloadDetailsProperties, IWorkloadDetailsState> {
    constructor(props: IWorkloadDetailsProperties) {
        super(props, {});
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);

        this._podsStore.addListener(PodsEvents.PodsFetchedEvent, this._onPodsUpdated);

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

        this._imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);

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

    public componentWillUnmount(): void {
        this._podsStore.removeChangedListener(this._onPodsUpdated);
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
        const podList = this._podsStore.getState().podsList;
        if (podList && podList.items) {
            this.setState({
                pods: podList.items.filter(p => this.state.item && Utils.isOwnerMatched(p.metadata, this.state.item.metadata.uid))
            });
        }
    }

    private _getColumns = (): ITableColumn<IWorkLoadDetailsItem>[] => {
        const columns: ITableColumn<IWorkLoadDetailsItem>[] = [
            {
                id: "w-image",
                name: Resources.ImageText,
                width: new ObservableValue(360),
                minWidth: 250,
                renderCell: this._renderImageCell
            },
            {
                id: "w-labels",
                name: Resources.LabelsText,
                width: -50,
                minWidth: 200,
                renderCell: (r, c, col, item) => WorkloadDetails._renderCellWithTags(r, c, col, item, (item) => item.parentMetaData.labels)
            },
            {
                id: "w-selector",
                name: Resources.SelectorText,
                width: -50,
                minWidth: 200,
                renderCell: (r, c, col, item) => WorkloadDetails._renderCellWithTags(r, c, col, item, (item) => (item.selector && item.selector.matchLabels) || {})
            }
        ];

        return columns;
    }

    private _getWorkloadDetails(): JSX.Element | null {
        if (this.state.item) {
            const metadata = this.state.item.metadata;
            if (metadata) {
                const tableItems: IWorkLoadDetailsItem[] = [{
                    podTemplate: this.state.item.spec && this.state.item.spec.template,
                    parentMetaData: metadata,
                    selector: this.state.item.spec && this.state.item.spec.selector
                }];
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
                        <CardContent className="workload-full-details-table" contentPadding={false}>
                            <Table
                                id="workload-full-details-table"
                                showHeader={true}
                                showLines={false}
                                singleClickActivation={false}
                                itemProvider={new ArrayItemProvider<IWorkLoadDetailsItem>(tableItems)}
                                columns={this._getColumns()}
                            />
                        </CardContent>
                    </CustomCard>
                );
            }
        }

        return null;
    }

    private _getAssociatedPods(): JSX.Element | null {
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

    private _renderImageCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IWorkLoadDetailsItem>, tableItem: IWorkLoadDetailsItem): JSX.Element => {
        const imageId = Utils.getImageIdForWorkload(Utils.getFirstContainerName(tableItem.podTemplate.spec), this.state.pods);
        const imageText = Utils.getFirstImageName(tableItem.podTemplate.spec) || "";
        const hasImageDetails: boolean = this._imageDetailsStore.hasImageDetails(imageId);
        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly>
                <Link
                    className="fontSizeM font-size-m text-ellipsis bolt-table-link"
                    rel={"noopener noreferrer"}
                    excludeTabStop
                    onClick={() => this._showImageDetails(imageId)}
                >
                    {imageText}
                </Link>
            </Tooltip>
            : defaultColumnRenderer(imageText);

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, hasImageDetails ? "bolt-table-cell-content-with-link" : "");
    }

    private static _renderCellWithTags(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<IWorkLoadDetailsItem>,
        tableItem: IWorkLoadDetailsItem,
        getItems: (tableItem: IWorkLoadDetailsItem) => { [key: string]: string }): JSX.Element {
        const itemToRender: React.ReactNode = <Tags items={getItems(tableItem)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _podsStore: PodsStore;
    private _workloadsStore: WorkloadsStore;
    private _imageDetailsStore: ImageDetailsStore;
}