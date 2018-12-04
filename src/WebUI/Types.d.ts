/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Deployment, V1DeploymentList, V1Pod, V1PodList, V1ReplicaSet, V1ReplicaSetList, V1ServiceList } from "@kubernetes/client-node";
import { IObservable } from "azure-devops-ui/Core/Observable";
import { IStatusProps } from "azure-devops-ui/Status";
import { IBaseProps } from "office-ui-fabric-react/lib/Utilities";

export interface IKubernetesSummary {
    namespace?: string;
    podList?: V1PodList;
    deploymentList?: V1DeploymentList;
    serviceList?: V1ServiceList;
    replicaSetList?: V1ReplicaSetList;
}

export interface IDeploymentItem {
    name?: string;
    replicaSetName?: string;
    uid?: string;
    pipeline?: string;
    pods?: string;
    statusProps?: IStatusProps;
    showRowBorder?: boolean;
    deployment?: V1Deployment;
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
     * Any of the properties MAY be accessed as an IObservable.
     */
    [property: string]: IObservable<any> | any;
}