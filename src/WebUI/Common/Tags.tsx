/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { Pill, PillSize } from "azure-devops-ui/Pill";
import { PillGroup, PillGroupOverflow } from "azure-devops-ui/PillGroup";
import { css } from "azure-devops-ui/Util";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./Tags.scss";
import React = require("react");

export interface ITagsProperties extends IVssComponentProperties {
    items: { [key: string]: string };
    showOnlyValues?: boolean;
}

export class Tags extends React.Component<ITagsProperties> {
    darkColor: any;

    public render(): React.ReactNode {
        const items = this.props.showOnlyValues ? this.props.items : Utils.getPillTags(this.props.items);
        return (
            <PillGroup className={css(this.props.className, "k8s-tags", "flex-row")} overflow={PillGroupOverflow.fade}>
                {
                    items && (items as string[]).map((tagText, index) => <Pill key={index} className="k8s-tag-pill" size={PillSize.compact}>{tagText}</Pill>)
                }
            </PillGroup>
        );
    }
}
