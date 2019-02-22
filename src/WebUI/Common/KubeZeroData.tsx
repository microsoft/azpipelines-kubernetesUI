/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import * as React from "react";
import { ZeroData } from "azure-devops-ui/ZeroData";
import { Card } from "azure-devops-ui/Card";
import { IVssComponentProperties } from "../Types";
import { BaseComponent, css } from "@uifabric/utilities/lib";
import { Link } from "azure-devops-ui/Link";
import "./Common.scss";
import "./BaseKubeTable.scss";
import "./Webplatform.scss";

export interface IKubeZeroDataProps extends IVssComponentProperties {
    title?: string;
    hyperLink?: string;
    descriptionText?: string;
    hyperLinkLabel?: string;
    additionalHelpText?: string;
    imagePath?: string;
    imageAltText?: string;
    className?: string;
    //This prop is used when zero data needs to be a component rather than full page render
    renderOnCard?: boolean; 
}

export class KubeZeroData extends BaseComponent<IKubeZeroDataProps> {
    constructor(props: IKubeZeroDataProps) {
        super(props);
    }

    public render(): JSX.Element {
        const zeroDataElm: JSX.Element = (
            <ZeroData
                className={css("flex-grow", this.props.className)}
                imageAltText={this.props.imageAltText || ""}
                imagePath={this.props.imagePath || ""}
                secondaryText={this._getTextArea()}
            />
        );
        return (
            this.props.renderOnCard ?
                <Card titleProps={{ text: this.props.title }} className={css("flex-grow", "item-top-padding", "kube-list-content")}>
                    {zeroDataElm}
                </Card> :
                zeroDataElm
        );
    }

    public static _getDefaultZeroData(hyperLink: string, hyperLinkLabel: string, description: string,
                                    additionalText: string, title?: string, className?: string, renderOnCard?: boolean): JSX.Element{
        return (
            <KubeZeroData
                imagePath={require("../../img/zero_data.png")}
                title={title}
                hyperLink={hyperLink}
                hyperLinkLabel={hyperLinkLabel}
                descriptionText={description}
                additionalHelpText={additionalText}
                className={className}
                renderOnCard={renderOnCard}
            />
        );
    }

    private _getTextArea(): JSX.Element {
        return (<div>
            {this._getDescription()}<br />
            {this._getHyperLink()}
        </div>);
    }

    private _getDescription(): JSX.Element | null {
        if (this.props.descriptionText) {
            return (<span>{this.props.descriptionText}</span>)
        }
        return null;
    }

    private _getHyperLink(): JSX.Element | null {
        if (this.props.hyperLink) {
            return (<span>
                <Link href={this.props.hyperLink} target="_blank" rel="nofollow noopener" ariaDescribedBy={this.props.additionalHelpText}>
                    {this.props.hyperLinkLabel}
                </Link>{" "}{this.props.additionalHelpText}
            </span>);
        }
        return null;
    }
}
