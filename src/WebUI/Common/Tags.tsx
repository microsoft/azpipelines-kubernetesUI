/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/
import { IVssComponentProperties } from "../Types";
import { BaseComponent, css } from "@uifabric/utilities";
import React = require("react");
import { Utils } from "../Utils";
import { Pill, PillSize } from "azure-devops-ui/Pill";
import "./Tags.scss";

export interface ITagsProperties extends IVssComponentProperties {
    items: { [key: string]: string };
}

export class Tags extends BaseComponent<ITagsProperties> {
    public render(): React.ReactNode {
        return (
            <div className={css(this.props.className, "k8s-tags flex-row")}>
                {
                    Utils.getPillTags(this.props.items)
                        .map(tagText => <Pill className="k8s-tag-pill" size={PillSize.compact}>{tagText}</Pill>)
                }
            </div>
        );
    }
}
