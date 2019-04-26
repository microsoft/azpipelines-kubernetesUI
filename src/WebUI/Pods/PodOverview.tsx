/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Pod } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { css } from "azure-devops-ui/Util";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { ITableColumn, SimpleTableCell as renderSimpleTableCell, Table, TableColumnStyle } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { Tags } from "../Common/Tags";
import * as Resources from "../Resources";
import { Utils } from "../Utils";
import "./PodOverview.scss";
import { IPodRightPanelProps } from "./PodsRightPanel";
import { Link } from "azure-devops-ui/Link";
import { StoreManager } from "../FluxCommon/StoreManager";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { getRunDetailsText } from "../RunDetails";

export interface IPodOverviewProps extends IPodRightPanelProps {
    // Overriding this to make sure we don't accept undefined
    pod: V1Pod;
    showImageDetails?: (imageId: string) => void;
}

export class PodOverview extends BaseComponent<IPodOverviewProps> {
    public render(): JSX.Element {
        const podDetails = PodOverview._getPodDetails(this.props.pod, this.props.showImageDetails);
        return (
            <CustomCard className="pod-overview-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium}>
                                {Resources.PodDetailsHeader}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent className="pod-full-details-table" contentPadding={true}>
                    {this._getCardContent()}
                </CardContent>
            </CustomCard>
        );
    }

    private static _getPodDetails = (pod: V1Pod, showImageDetails?: (imageId: string) => void): any[] => {
        const createTime = pod.metadata.creationTimestamp ? new Date(pod.metadata.creationTimestamp) : new Date().getTime();
        const statusReason = pod.status.reason ? localeFormat(" | {0}", pod.status.reason) : "";
        const statusText = localeFormat("{0}{1}", pod.status.phase, statusReason);
        const hasAnnotations = pod.metadata.annotations && Object.keys(pod.metadata.annotations).length > 0;
        const hasLabels = pod.metadata.labels && Object.keys(pod.metadata.labels).length > 0;
        const { imageText, imageTooltipText } = Utils.getImageText(pod.spec);
        const imageId: string = Utils.getImageIdsForPods([pod])[0] || "";
        const conditionsText = PodOverview._getPodConditionsText(pod);
        const jobName = getRunDetailsText(pod.metadata.annotations);
        let podDetails: any[] = [];
        // order of rows to be preserved as per spec
        createTime && podDetails.push({ key: Resources.Created, value: createTime });
        jobName && podDetails.push({ key: Resources.JobText, value: jobName });
        hasAnnotations && podDetails.push({ key: Resources.AnnotationsText, value: pod.metadata.annotations });
        pod.spec.restartPolicy && podDetails.push({ key: Resources.RestartPolicyText, value: pod.spec.restartPolicy });
        pod.status.qosClass && podDetails.push({ key: Resources.QoSClassText, value: pod.status.qosClass });
        pod.spec.nodeName && podDetails.push({ key: Resources.NodeText, value: pod.spec.nodeName });
        imageText && podDetails.push({ key: Resources.ImageText, value: imageText, valueTooltipText: imageTooltipText, imageId: imageId, showImageDetails: showImageDetails });
        hasLabels && podDetails.push({ key: Resources.LabelsText, value: pod.metadata.labels });
        statusText && podDetails.push({ key: Resources.StatusText, value: statusText });
        conditionsText && podDetails.push({ key: Resources.ConditionsText, value: conditionsText });

        return podDetails;
    }

    private static _getPodConditionsText(pod: V1Pod): string {
        let conditions: string[] = [];
        if (pod.status) {
            conditions = (pod.status.conditions || []).map<string>(condition => localeFormat("{0}={1}", condition.type || "", condition.status || ""));
        }

        return conditions.join("; ") || "";
    }

    private static _renderValueCell = (tableItem: any): JSX.Element => {
        const { key, value, valueTooltipText } = tableItem;
        switch (key) {
            case Resources.Created:
                return (
                    <div className="text-ellipsis details-card-value-field-size">
                        <Ago date={new Date(value)} format={AgoFormat.Extended} />
                    </div>
                );

            case Resources.LabelsText:
            case Resources.AnnotationsText:
                return (
                    <div className="text-ellipsis details-card-value-field-size">
                        <Tags items={value} className="body-s" />
                    </div>
                );

            case Resources.ImageText:
                return PodOverview._renderImageCell(tableItem);

            default:
                const itemToRender = defaultColumnRenderer(value, undefined, valueTooltipText);
                return (
                    <div className="text-ellipsis details-card-value-field-size">
                        {itemToRender}
                    </div>
                );
        }
    }

    private _getCardContent = (): JSX.Element => {
        const items = PodOverview._getPodDetails(this.props.pod, this.props.showImageDetails);
        return (
            <div className="flex-column details-card-content">
                {items.map((item, index) => (
                    <div className="flex-row details-card-row-size body-m" key={index}>
                        <div className="text-ellipsis secondary-text details-card-info-field-size">
                            {item.key}
                        </div>
                        {PodOverview._renderValueCell(item)}
                    </div>))
                }
            </div>
        );
    }

    private static _renderImageCell = (tableItem: any): JSX.Element => {
        const { key, value, valueTooltipText, imageId, showImageDetails } = tableItem;
        const imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
        let imageDetailsUnavailableTooltipText = "";
        const hasImageDetails: boolean | undefined = imageDetailsStore.hasImageDetails(imageId);
        // If hasImageDetails is undefined, then image details promise has not resolved, so do not set imageDetailsUnavailable tooltip
        if (hasImageDetails === false) {
            imageDetailsUnavailableTooltipText = localeFormat("{0} | {1}", valueTooltipText || value, Resources.ImageDetailsUnavailableText);
        }

        const itemToRender = hasImageDetails ?
            <Tooltip overflowOnly>
                <Link
                    className="fontSizeM font-size-m text-ellipsis bolt-table-link"
                    rel={"noopener noreferrer"}
                    excludeTabStop
                    onClick={(e) => {
                        e.preventDefault();
                        showImageDetails(imageId);
                    }}
                >
                    {value}
                </Link>
            </Tooltip>
            : defaultColumnRenderer(value, undefined, imageDetailsUnavailableTooltipText);

        return (
            <div className="text-ellipsis details-card-value-field-size body-m">
                {itemToRender}
            </div>
        );
    }
}
