/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

export const enum PodsRightPanelTabsKeys {
    PodsDetailsKey = "pod-details",
    PodsLogsKey = "pod-logs",
    PodsYamlKey = "pod-yaml"
}

export const enum SelectedItemKeys {
    ReplicaSetKey = "replica-set",
    DaemonSetKey = "daemon-set",
    StatefulSetKey = "stateful-set",
    OrphanPodKey = "orphan-pod",
    ServiceItemKey = "service-item",
    ImageDetailsKey = "image-details",
    PodDetailsKey = "pod-details"
}

export namespace WorkloadsEvents {
    export const DeploymentsFetchedEvent: string = "DEPLOYMENTS_FETCHED_EVENT";
    export const ReplicaSetsFetchedEvent: string = "REPLICA_SETS_FETCHED_EVENT";
    export const DaemonSetsFetchedEvent: string = "DAEMON_SETS_FETCHED_EVENT";
    export const StatefulSetsFetchedEvent: string = "STATEFUL_SETS_FETCHED_EVENT";
    export const WorkloadPodsFetchedEvent: string = "WORKLOAD_PODS_FETCHED_EVENT";
    export const WorkloadsFoundEvent: string = "ZERO_WORKLOADS_FOUND_EVENT";
}

export namespace ServicesEvents {
    export const ServicesFetchedEvent: string = "SERVICES_FETCHED_EVENT";
    export const ServicePodsFetchedEvent: string = "SERVICE_PODS_FETCHED_EVENT";
    export const ServicesFoundEvent: string = "ZERO_SERVICES_FOUND_EVENT";
}

export namespace PodsEvents {
    export const PodsFetchedEvent: string = "ALL_PODS_FETCHED_EVENT";
}

export namespace ImageDetailsEvents {
    export const HasImageDetailsEvent: string = "HAS_IMAGE_DETAILS_EVENT";
    export const GetImageDetailsEvent: string = "GET_IMAGE_DETAILS_EVENT";
}

export namespace HyperLinks {
    export const WorkloadsLink: string = "https://go.microsoft.com/fwlink/?linkid=2083857";
    export const LinkToPodsUsingLabelsLink: string = "https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/";
    export const ServicesLink: string = "https://go.microsoft.com/fwlink/?linkid=2083858";
}