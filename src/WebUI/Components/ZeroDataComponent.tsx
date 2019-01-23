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
    textline1?: string,
    hyperLinkLabel?: string,
    textline2?: string
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
            <div>
                <Card title={this.props.title} className={css("flex-grow", "top-padding", "kube-list-content")}>
                    <ZeroData
                        className="flex-grow"
                        imageAltText={this.props.imageAltText || ""}
                        imagePath={this.props.imagePath || ""}
                        secondaryText={this.__getTextArea()}
                    />
                </Card>
            </div>
        );
    }

    private __getTextArea(): JSX.Element {
        return (<div>
            {this.__getTextLine1()}<br />
            {this.__getHyperLink()}
        </div>);
    }

    private __getTextLine1(): JSX.Element | null {
        if (this.props.textline1) {
            return (<span>{this.props.textline1}</span>)
        }
        return null;
    }

    private __getHyperLink(): JSX.Element | null {
        if (this.props.hyperLink) {
            return (<span>
                <Link href={this.props.hyperLink} target="_blank" rel="nofollow noopener">
                    {this.props.hyperLinkLabel}
                </Link>{" "}{this.props.textline2}
            </span>);
        }
        return null;
    }
}
