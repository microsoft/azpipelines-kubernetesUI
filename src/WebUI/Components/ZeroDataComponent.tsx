import * as React from "react";
import { ZeroData } from 'azure-devops-ui/ZeroData';
import { Card } from 'azure-devops-ui/Card';
import { IVssComponentProperties } from '../Types';
import { BaseComponent, css } from "@uifabric/utilities/lib";
import { Link } from 'azure-devops-ui/Link';
import './Common.scss';
import './ListComponent.scss'

export interface IZeroDataComponentProps extends IVssComponentProperties {
    title?: string,
    hyperLink?: string,
    descriptionText?: string,
    hyperLinkLabel?: string,
    additionalHelpText?: string
    imagePath?: string,
    imageAltText?: string
    className?: string
}

export class ZeroDataComponent extends BaseComponent<IZeroDataComponentProps> {
    constructor(props: IZeroDataComponentProps) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <Card title={this.props.title} className={css("flex-grow", "top-padding", "kube-list-content", this.props.className)}>
                <ZeroData
                    className="flex-grow"
                    imageAltText={this.props.imageAltText || ""}
                    imagePath={this.props.imagePath || ""}
                    secondaryText={this._getTextArea()}
                />
            </Card>
        );
    }

    private _getTextArea(): JSX.Element {
        return (<div>
            {this._getTextLine1()}<br />
            {this._getHyperLink()}
        </div>);
    }

    private _getTextLine1(): JSX.Element | null {
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
