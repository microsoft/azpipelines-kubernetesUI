/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { css } from "azure-devops-ui/Util";
import { Card, CardContent, CustomCard } from "azure-devops-ui/Card";
import { CustomHeader, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Link } from "azure-devops-ui/Link";
import { ZeroData } from "azure-devops-ui/ZeroData";
import * as React from "react";
import { KubeImage } from "../../Contracts/Contracts";
import { HyperLinks } from "../Constants";
import { KubeFactory } from "../KubeFactory";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import "./KubeZeroData.scss";

export interface IKubeZeroDataProps extends IVssComponentProperties {
    title?: string;
    hyperLink?: string;
    descriptionText?: string;
    hyperLinkLabel?: string;
    imagePath?: string;
    imageAltText?: string;
    className?: string;
    primaryText?: string;
    primaryTextClassName?: string;
    // this prop is used when zero data needs to be a component rather than full page render
    renderOnCard?: boolean;
}

export class KubeZeroData extends React.Component<IKubeZeroDataProps> {
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

    public static getDefaultZeroData(): JSX.Element {
        return (
            <ZeroData
                className="k8s-zero-data"
                primaryText={Resources.StartUsingKubeResourceText}
                secondaryText={
                    <>
                        <div>{Resources.DeployKubeResourceText}</div>
                        <Link
                            href={HyperLinks.WorkloadsLink}
                            target="_blank"
                            rel="nofollow noopener"
                        >
                            {Resources.LearnMoreKubeResourceText}
                        </Link>
                    </>
                }
                imageAltText={Resources.StartUsingKubeResourceText}
                imagePath={KubeFactory.getImageLocation(KubeImage.zeroData) || ""}
            />
        );
    }

    public static getResourceDeletedErrorComponent(): JSX.Element {
        return (
            <ZeroData
                className="k8s-resource-deleted-error"
                primaryText={""}
                secondaryText={
                    <div>
                        {Resources.KubernetesResourceDeletedHelpText}
                        <Link
                            href={HyperLinks.ResourceDeletedLink}
                            target="_blank"
                            rel="nofollow noopener"
                        >
                            {Resources.LearnMoreText}
                        </Link>
                    </div>
                }
                imageAltText={Resources.KubernetesResourceDeletedAltText}
                imagePath={KubeFactory.getImageLocation(KubeImage.resourceDeleted) || ""}
            />
        );
    }

    public static getResourceAccessDeniedErrorComponent(): JSX.Element {
        return (
            <ZeroData
                className="k8s-resource-access-denied-error"
                primaryText={""}
                secondaryText={
                    <div>{Resources.KubernetesAuthValidationHelpText}</div>
                }
                imageAltText={Resources.KubernetesAuthValidationTitleText}
                imagePath={KubeFactory.getImageLocation(KubeImage.resourceAccessDenied) || ""}
            />
        );
    }

    public static getNoResultsZeroData(): JSX.Element {
        return (
            <Card className="k8s-zero-data-filter-card k8s-card-padding flex-grow flex-center bolt-card-no-vertical-padding"
                contentProps={{ contentPadding: false }}>
                <ZeroData
                    className="k8s-zero-filter-data"
                    secondaryText={
                        <div className="secondary-text body-xl">{Resources.NoResultsFoundText}</div>
                    }
                    imageAltText={Resources.NoResultsFoundText}
                    imagePath={KubeFactory.getImageLocation(KubeImage.zeroResults) || ""}
                />
            </Card>
        );
    }

    public static getServicesZeroData(): JSX.Element {
        return (
            <Card className="services-zero-data-card k8s-card-padding flex-grow flex-center bolt-card-no-vertical-padding"
                contentProps={{ contentPadding: false }}>
                <ZeroData
                    className="k8s-zero-services-data"
                    primaryText={Resources.DeployServices}
                    secondaryText={
                        <>
                            <div>{Resources.StartingUsingServiceText}</div>
                            <Link
                                href={HyperLinks.ServicesLink}
                                target="_blank"
                                rel="nofollow noopener"
                            >
                                {Resources.LearnMoreText}
                            </Link>
                        </>
                    }
                    imageAltText={Resources.DeployServices}
                    imagePath={KubeFactory.getImageLocation(KubeImage.zeroWorkloads) || ""}
                />
            </Card>
        );
    }

    public static getWorkloadsZeroData(): JSX.Element {
        return (
            <Card className="workloads-zero-data-card k8s-card-padding flex-grow flex-center bolt-card-no-vertical-padding"
                contentProps={{ contentPadding: false }}>
                <ZeroData
                    className="k8s-zero-workloads-data"
                    primaryText={Resources.DeployWorkloads}
                    secondaryText={
                        <>
                            <div>{Resources.WorkloadsZeroDataText}</div>
                            <Link
                                href={HyperLinks.WorkloadsLink}
                                target="_blank"
                                rel="nofollow noopener"
                            >
                                {Resources.LearnMoreText}
                            </Link>
                        </>
                    }
                    imageAltText={Resources.DeployWorkloads}
                    imagePath={KubeFactory.getImageLocation(KubeImage.zeroResults) || ""}
                />
            </Card>
        );
    }

    public static getServiceAssociatedPodsZeroData(): JSX.Element {
        return (
            <CustomCard className="service-associated-pods-zero-data-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium}>
                                {Resources.AssociatedPodsText}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent contentPadding={false}>
                    <ZeroData
                        className="k8s-zero-service-pods-data k8s-zero-data-max-width"
                        secondaryText={
                            <>
                                <div className="body-xl fontWeightSemiBold font-weight-semibold">{Resources.NoPodsText}</div>
                                <div>{Resources.NoPodsForSvcText}</div>
                                <Link
                                    href={HyperLinks.LinkToPodsUsingLabelsLink}
                                    target="_blank"
                                    rel="nofollow noopener"
                                >
                                    {Resources.NoPodsForSvcLinkText}
                                </Link>
                            </>
                        }
                        imageAltText={Resources.NoPodsText}
                        imagePath={KubeFactory.getImageLocation(KubeImage.zeroWorkloads) || ""}
                    />
                </CardContent>
            </CustomCard>
        );
    }

    public static getWorkloadAssociatedPodsZeroData(): JSX.Element {
        return (
            <CustomCard className="workload-associated-pods-zero-data-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium}>
                                {Resources.AssociatedPodsText}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent contentPadding={false}>
                    <ZeroData
                        className="k8s-zero-workload-pods-data k8s-zero-data-max-width"
                        secondaryText={
                            <>
                                <div>{Resources.NoPodsFoundText}</div>
                                <Link
                                    href={HyperLinks.LinkToPodsUsingLabelsLink}
                                    target="_blank"
                                    rel="nofollow noopener"
                                >
                                    {Resources.LearnMoreText}
                                </Link>
                            </>
                        }
                        imageAltText={Resources.NoPodsFoundText}
                        imagePath={KubeFactory.getImageLocation(KubeImage.zeroWorkloads) || ""}
                    />
                </CardContent>
            </CustomCard>
        );
    }

    private _getTextArea(): JSX.Element {
        const primaryText: string | undefined = this.props.primaryText;
        const primaryTxtClass: string = this.props.primaryTextClassName ? this.props.primaryTextClassName : "zerod-primary-text";
        return (<div>
            {primaryText ? <span className={primaryTxtClass}>{primaryText}</span> : null}<br />
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
                <Link href={this.props.hyperLink} target="_blank" rel="nofollow noopener" ariaDescribedBy={this.props.hyperLinkLabel}>
                    {this.props.hyperLinkLabel}
                </Link>
            </span>);
        }
        return null;
    }
}
