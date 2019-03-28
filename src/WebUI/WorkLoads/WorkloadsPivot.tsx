/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1PodList } from "@kubernetes/client-node";
import { BaseComponent, css } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format } from "azure-devops-ui/Core/Util/String";
import { Filter, IFilterItemState, IFilterState } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { KubeResourceType } from "../../Contracts/KubeServiceBase";
import { KubeZeroData } from "../Common//KubeZeroData";
import { NameKey, TypeKey } from "../Common/KubeFilterBar";
import { KubeSummary } from "../Common/KubeSummary";
import "../Common/KubeSummary.scss";
import { PodsEvents, WorkloadsEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetailsActionsCreator } from "../ImageDetails/ImageDetailsActionsCreator";
import { PodsActionsCreator } from "../Pods/PodsActionsCreator";
import { PodsStore } from "../Pods/PodsStore";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { DeploymentsTable } from "../Workloads/DeploymentsTable";
import { OtherWorkloads } from "../Workloads/OtherWorkloadsTable";
import { WorkloadsActionsCreator } from "./WorkloadsActionsCreator";
import { WorkloadsFilterBar } from "./WorkloadsFilterBar";
import { WorkloadsStore } from "./WorkloadsStore";

export interface IWorkloadsPivotState {
    workloadResourceSize: number;
    imageList: string[];
}

export interface IWorkloadsPivotProps extends IVssComponentProperties {
    filter: Filter;
    namespace?: string;
    filterToggled: ObservableValue<boolean>;
}

export class WorkloadsPivot extends BaseComponent<IWorkloadsPivotProps, IWorkloadsPivotState> {
    constructor(props: IWorkloadsPivotProps) {
        super(props, {});

        this._workloadsStore = StoreManager.GetStore<WorkloadsStore>(WorkloadsStore);
        // initialize pods store as pods list will be required in workloadPodsView on item selection
        this._podsStore = StoreManager.GetStore<PodsStore>(PodsStore);

        this._podsActionCreator = ActionsCreatorManager.GetActionCreator<PodsActionsCreator>(PodsActionsCreator);
        this._imageActionsCreator = ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator);
        this._workloadsActionCreator = ActionsCreatorManager.GetActionCreator<WorkloadsActionsCreator>(WorkloadsActionsCreator);

        this.state = {
            workloadResourceSize: 0,
            imageList: []
        };

        this._podsStore.addListener(PodsEvents.PodsFetchedEvent, this._onPodsFetched);
        this._workloadsStore.addListener(WorkloadsEvents.WorkloadPodsFetchedEvent, this._onOrphanPodsFetched);
        this._workloadsStore.addListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);

        this._workloadsActionCreator.getDeployments(KubeSummary.getKubeService());
        // fetch all pods in parent component as the podList is required in selected workload pods view
        this._podsActionCreator.getPods(KubeSummary.getKubeService());
    }

    public render(): React.ReactNode {
        return (
            <>
                {this._getFilterBar()}
                <div className={css("workloads-pivot-data", "k8s-pivot-data")}>
                    {this._getContent()}
                </div>
            </>
        );
    }

    public componentWillUnmount(): void {
        this._workloadsStore.removeListener(WorkloadsEvents.WorkloadsFoundEvent, this._onDataFound);
        this._workloadsStore.removeListener(WorkloadsEvents.WorkloadPodsFetchedEvent, this._onOrphanPodsFetched);
        this._podsStore.removeListener(PodsEvents.PodsFetchedEvent, this._onPodsFetched);
    }

    public componentDidUpdate(prevProps: IWorkloadsPivotProps, prevState: IWorkloadsPivotState) {
        const imageService = KubeSummary.getImageService();
        imageService && (this.state.imageList.length > 0) && this._imageActionsCreator.setHasImageDetails(imageService, this.state.imageList);
    }

    private _onPodsFetched = (): void => {
        const podlist: V1PodList | undefined = this._podsStore.getState().podsList;
        if (podlist && podlist.items && podlist.items.length > 0) {
            const imageList = Utils.getImageIdsForPods(podlist.items);
            this.setState({
                imageList: imageList
            });
        }
    }

    private _onOrphanPodsFetched = (): void => {

    }

    private _onDataFound = (): void => {
        const workloadSize = this._workloadsStore.getWorkloadSize();
        if (this.state.workloadResourceSize <= 0 && workloadSize > 0) {
            this.setState({ workloadResourceSize: workloadSize });
        }
    }

    private _getContent(): JSX.Element {
        return (this.state.workloadResourceSize === 0 ? this._getZeroData() :
            <>
                {this._showComponent(KubeResourceType.Deployments) && this._getDeployments()}
                {this._getOtherWorkloadsComponent()}
            </>);
    }

    private _getFilterBar(): JSX.Element {
        return (
            <WorkloadsFilterBar
                filter={this.props.filter}
                filterToggled={this.props.filterToggled}
                className={css("workloads-pivot-filter", "k8s-pivot-filter")}
            />
        );
    }

    private _getOtherWorkloadsComponent(): JSX.Element {
        return (<OtherWorkloads
            key={format("sts-list-{0}", this.props.namespace || "")}
            nameFilter={this._getNameFilterValue()}
            typeFilter={this._getTypeFilterValue()}
        />);
    }

    private _getDeployments(): JSX.Element {
        return (<DeploymentsTable
            key={format("dc-{0}", this.props.namespace || "")}
            nameFilter={this._getNameFilterValue()}
        />);
    }

    private _getNameFilterValue(): string | undefined {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[NameKey] : null;
        return filterItem ? (filterItem.value as string) : undefined;
    }

    private _getTypeFilterValue(): any[] {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[TypeKey] : null;
        const selections: any[] = filterItem ? filterItem.value : [];
        return selections;
    }

    private _showComponent(resourceType: KubeResourceType): boolean {
        const selections: KubeResourceType[] = this._getTypeFilterValue();
        // if no filter selections are made, show all components
        if (selections.length > 0) {
            return selections.indexOf(resourceType) != -1;
        }

        return true;
    }

    private _getZeroData(): JSX.Element {
        return KubeZeroData.getWorkloadsZeroData();
    }

    private _workloadsStore: WorkloadsStore;
    private _workloadsActionCreator: WorkloadsActionsCreator;
    private _podsActionCreator: PodsActionsCreator;
    private _podsStore: PodsStore;
    private _imageActionsCreator: ImageDetailsActionsCreator;
}