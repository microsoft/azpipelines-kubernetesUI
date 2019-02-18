import * as React from "react";
import { ZeroData } from 'azure-devops-ui/ZeroData';
import { Card } from 'azure-devops-ui/Card';
import { IVssComponentProperties } from '../Types';
import { BaseComponent, css } from "@uifabric/utilities/lib";
import { Link } from 'azure-devops-ui/Link';
import './Common.scss';
import './BaseKubeTable.scss'

export interface IKubeZeroDataProps extends IVssComponentProperties {
    title?: string,
    hyperLink?: string,
    descriptionText?: string,
    hyperLinkLabel?: string,
    additionalHelpText?: string
    imagePath?: string,
    imageAltText?: string
    className?: string
}

export class KubeZeroData extends BaseComponent<IKubeZeroDataProps> {
    constructor(props: IKubeZeroDataProps) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <Card titleProps={{ text: this.props.title }} className={css("flex-grow", "item-top-padding", "kube-list-content", this.props.className)}>
                <ZeroData
                    className="flex-grow"
                    imageAltText={this.props.imageAltText || ""}
                    imagePath={this.props.imagePath || ""}
                    secondaryText={this._getTextArea()}
                />
            </Card>
        );
    }

    public static _getDefaultZeroData(hyperLink: string, hyperLinkLabel: string, description: string,
                                    additionalText: string, title?: string, className?: string): JSX.Element{
        return (
            <KubeZeroData
                imagePath={require("../zero_data.png")}
                title={title}
                hyperLink={hyperLink}
                hyperLinkLabel={hyperLinkLabel}
                descriptionText={description}
                additionalHelpText={additionalText}
                className={className}
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
                <Link href={this.props.hyperLink} target="_blank" rel="nofollow noopener">
                    {this.props.hyperLinkLabel}
                </Link>{" "}{this.props.additionalHelpText}
            </span>);
        }
        return null;
    }
}
