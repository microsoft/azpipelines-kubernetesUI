/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1DaemonSet, V1DaemonSetList, V1Deployment, V1DeploymentList, V1PodList, V1ReplicaSet, V1ReplicaSetList, V1Service, V1ServiceList, V1StatefulSet, V1StatefulSetList, V1Pod } from "@kubernetes/client-node";
import { IBaseProps } from "@uifabric/utilities";
import { IObservable } from "azure-devops-ui/Core/Observable";
import { IStatusProps } from "azure-devops-ui/Status";

export interface IKubernetesSummary {
    namespace?: string;
    podList?: V1PodList;
    deploymentList?: V1DeploymentList;
    serviceList?: V1ServiceList;
    replicaSetList?: V1ReplicaSetList;
    daemonSetList?: V1DaemonSetList;
    statefulSetList?: V1StatefulSetList;
}

export interface IDeploymentReplicaSetItem {
    name?: string;
    replicaSetName?: string;
    deploymentId?: string;
    replicaSetId?: string;
    pipeline?: string;
    pods?: string;
    podsTooltip?: string;
    statusProps?: IStatusProps;
    showRowBorder?: boolean;
    deployment?: V1Deployment;
    imageId: string;
    imageDisplayText: string;
    imageTooltip?: string;
    creationTimeStamp: Date;
    kind?: string;
}

export interface IServiceItem {
    package: string;
    type: string;
    clusterIP: string;
    externalIP: string;
    port: string;
    creationTimestamp: Date;
    uid: string;
    pipeline: string;
    service?: V1Service;
    kind?: string;
}

export interface IDeploymentReplicaSetMap {
    deployment: V1Deployment;
    //this list is sorted in descending order
    replicaSets: V1ReplicaSet[];
}

export interface ISetWorkloadTypeItem {
    name: string;
    uid: string;
    kind: string;
    imageId: string;
    imageDisplayText: string;
    imageTooltip?: string;
    desiredPodCount: number;
    currentPodCount: number;
    creationTimeStamp: Date;
    payload: V1DaemonSet | V1StatefulSet | V1ReplicaSet | V1Pod;
    statusProps?: IStatusProps;
    statusTooltip?: string;
}

export interface IPodDetailsSelectionProperties {
    parentUid: string;
    serviceSelector?: string;
    serviceName?: string;
}

export interface IVssComponentProperties extends IBaseProps {
    /**
     * Components may specify a css classe list that should be applied to the primary
     * element of the component when it is rendered.
     */
    className?: string;

    /**
     * Components MAY specify an order value which is a number > 0 which defines its
     * rendering order when multiple components target the same componentRegion. If the
     * order is NOT specified it defaults to Number.MAX_VALUE.
     */
    componentOrder?: number;

    /**
     * Key value for this component that MUST be set when the component is rendered
     * into a set of components.
     */
    key?: string | number;

    /**
     * Mark TTI callback for child components 
     */
    markTTICallback?: () => void;

    /**
     * Any of the properties MAY be accessed as an IObservable.
     */
    [property: string]: IObservable<any> | any;
}

export interface IPodParentItem {
    name: string;
    kind: string;
}