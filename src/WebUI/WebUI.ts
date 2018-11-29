/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as React from "react";
import { showRootComponent } from "../Common";
import { IKubeService } from "../Contracts/Contracts";
import { AzureDevOpsKubeService } from "../Service/Service";
import { IKubeSummaryProps, KubeSummary } from "./Components/KubeSummary";

const service: IKubeService = new AzureDevOpsKubeService("<service-endpoint-id>", "default");
const props: IKubeSummaryProps = {
  kubeService: service,
  title: ""
};

showRootComponent(React.createElement(KubeSummary, props));