// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
define("Environments/Providers/Kubernetes/Resources", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AgeText = "Created";
    exports.NameText = "Name";
    exports.StatusText = "Status";
    exports.ImageText = "Image";
    exports.PodsDetailsText = "Pod";
    exports.StrategyText = "Strategy";
    exports.ReplicasCountText = "Pods #";
    exports.DeploymentsDetailsText = "Deployments";
    exports.ClusterIPText = "Cluster IP";
    exports.ExternalIPText = "External IP";
    exports.TypeText = "Type";
    exports.ReplicaSetText = "ReplicaSet";
    exports.PackageText = "Package";
    exports.PipelineText = "Pipeline";
    exports.PodsText = "Pods running";
    exports.PortText = "Port";
    exports.NamespaceHeadingText = "Namespace: {0}";
    exports.PivotServiceText = "Services";
    exports.PivotWorkloadsText = "Workloads";
    exports.PodIP = "IP";
    exports.Created = "Created";
    exports.AgoBy = " ago. Image: {0}";
    exports.Deployment = "Deployment: {0}";
    exports.ReplicaSet = "ReplicaSet: {0}";
    exports.ServiceCreatedText = "Service created {0}"
    exports.DetailsText = "Details";
    exports.LabelsText = "Labels";
    exports.SelectorText = "Selector";
    exports.SessionAffinityText = "Session affinity";
    exports.NoneText = "None";
    exports.AssociatedPodsText = "Associated pods";
    exports.DaemonSetText = "DaemonSet";
    exports.StatefulSetText = "StatefulSet";
    exports.DeploymentText = "Deployment";
<<<<<<< HEAD
    exports.LearnMoreText = "Learn more";
    exports.NoPodsForSvcText = "This service currently does not map to any pods";
    exports.NoWorkLoadsText = "No workloads are detected in this Kubernetes namespace";
    exports.LinkSvcToPodsText = "about how labels and selectors can be used to map a service to pods";
    exports.CreateWorkLoadText = "about how workloads can be added to the namespace";
    exports.NoServicesText = "No services are detected in this Kubernetes namespace";
    exports.CreateServiceText = "about how services can be added to the namespace";
=======
    exports.SummaryText = "Summary";
    exports.KindText = "Kind";
    exports.AnnotationsText = "Annotations";
    exports.RestartPolicyText = "Restart policy";
    exports.QoSClassText = "QoS class";
    exports.NodeText = "Node";
    exports.PodsListHeaderText = "Pods";
    exports.LogsText = "Logs";
    exports.YamlText = "YAML";
    exports.Ago = " ago";
    exports.NoPodsFoundText = "No pods are detected in this Kubernetes workload";
>>>>>>> origin/master
});