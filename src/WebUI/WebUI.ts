import * as React from "react";

import { showRootComponent } from "../Common";
import { IKubeService } from "../Contracts/Contracts";
import { AzureDevOpsKubeService } from "../Service/Service";
import { KubeSummary, IKubeSummaryProps } from "./Components/KubeSummary";

const service: IKubeService = new AzureDevOpsKubeService("82e34269-de6c-4dfb-aac8-e8d459896a5e", "default");
const props: IKubeSummaryProps = {
  kubeService: service,
  title: ""
};

showRootComponent(React.createElement(KubeSummary, props));