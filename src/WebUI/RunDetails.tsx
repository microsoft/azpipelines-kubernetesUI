import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { Link } from "azure-devops-ui/Link";
/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as React from "react";
import * as Resources from "../Resources";
import "./RunDetails.scss";
import { IMetadataAnnotationPipeline, Utils } from "./Utils";

export function getRunDetailsText(annotations?: { [key: string]: string }, jobAndPipelineDetails?: IMetadataAnnotationPipeline, createdAgo?: string): React.ReactNode {
    let pipelineDetails: IMetadataAnnotationPipeline = {} as IMetadataAnnotationPipeline;
    if (jobAndPipelineDetails) {
        pipelineDetails = jobAndPipelineDetails;
    }
    else if (annotations) {
        pipelineDetails = Utils.getPipelineDetails(annotations);
    }
    else {
        return "";
    }

    if (!createdAgo && !pipelineDetails.jobName) {
        return null;
    }

    const trimmedJobName = pipelineDetails.jobName && pipelineDetails.jobName.replace(/^"|"$/g, "");
    const first = createdAgo
        ? (trimmedJobName
            ? localeFormat(Resources.ServiceCreatedWithPipelineText, createdAgo, trimmedJobName)
            : localeFormat(Resources.CreatedAgo, createdAgo))
        : trimmedJobName;

    const runElement = pipelineDetails.runName
        ? (pipelineDetails.runUrl
            ? (<Link className={"run-name-link bolt-table-link"} rel={"noopener noreferrer"} href={pipelineDetails.runUrl}> {"#" + pipelineDetails.runName} </Link>)
            : "#" + pipelineDetails.runName)
        : undefined;

    let second = runElement;
    if (pipelineDetails.pipelineName) {
        // Trying to format the resource string with {0} possibly being a link.
        // First put the pipeline name, and in the place on run, put {0}
        // Pipeline name might have surrounding quotes
        const runText = localeFormat(Resources.RunInformationForWorkload, "{0}", pipelineDetails.pipelineName.replace(/^"|"$/g, ""));

        // Find index of the run placeholder
        const indexOfRun = runText.indexOf("{0}");

        second = (<>
            {runText.substring(0, indexOfRun - 1)}
            {runElement}
            {runText.substring(indexOfRun + 3)}
        </>);
    }

    return (
        <>
            {first}
            {
                second
                    ? <>
                        <span className={"runs-bullet"}>•</span>
                        {second}
                    </>
                    : undefined
            }
        </>
    )

}
