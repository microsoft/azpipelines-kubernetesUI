import * as React from "react";

import { showRootComponent } from "../Common";
import { IKubeService } from "../Contracts/Contracts";
import { AzureDevOpsKubeService } from "../Service/Service";
import { KubeSummary, IKubeSummaryProps } from "./Components/KubeSummary";

const service: IKubeService = new AzureDevOpsKubeService("<service-endpoint-id>", "default");
const props: IKubeSummaryProps = {
  kubeService: service,
  title: ""
};

showRootComponent(React.createElement(KubeSummary, props));