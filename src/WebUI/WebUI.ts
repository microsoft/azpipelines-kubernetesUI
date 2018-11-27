import * as React from "react";

import { showRootComponent } from "../Common";
import { IKubeService } from "../Contracts/Contracts";
import { AzureDevOpsKubeService } from "../Service/Service";
import { KubeSummary, IKubeSummaryProps } from "./Components/KubeSummary";

let service: IKubeService = new AzureDevOpsKubeService("<service-endpoint-id>", "default");
let props: IKubeSummaryProps = {
    kubeService: service
}

showRootComponent(React.createElement(KubeSummary, props));