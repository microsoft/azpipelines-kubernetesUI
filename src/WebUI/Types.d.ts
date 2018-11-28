import { IBaseProps } from "office-ui-fabric-react/lib/Utilities";
import { IObservable } from "azure-devops-ui/Core/Observable";
import { V1PodList, V1DeploymentList, V1ServiceList, V1ReplicaSetList, V1Deployment, V1ReplicaSet } from "@kubernetes/client-node";
import { IStatusProps } from "azure-devops-ui/Status";

export interface INameReference {
    name: string;
    namespace: string;
}

export interface IPod extends INameReference {
    status: string;
    nodeName: string;
    image: string;
}

export interface IDeployment extends INameReference {
    replicas: number;
    readyReplicas: number;
    strategy: string;
}

export interface IService extends INameReference {
    clusterIP: string;
    type: string;
    sessionAffinity: string;
    externalIP: string;
}

export interface IReplicaset extends INameReference {
    replicas: number;
    readyReplicas: number;
    appName: string;
}

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