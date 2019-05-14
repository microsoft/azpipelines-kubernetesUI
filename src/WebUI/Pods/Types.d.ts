/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { IStatusProps } from "azure-devops-ui/Status";
import { IVssComponentProperties } from "../Types";

export interface IPodRightPanelProps extends IVssComponentProperties {
    pod: V1Pod | undefined;
    podUid?: string;
    podStatusProps?: IStatusProps;
    statusTooltip?: string;
    showImageDetails?: (imageId: string) => void;
    notifyTabChange?: () => void;
}