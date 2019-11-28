/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/


import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderDescription, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";
import { ITableColumn, Table, ITableProps } from "azure-devops-ui/Table";
import { css } from "azure-devops-ui/Util";
import * as Date_Utils from "azure-devops-ui/Utilities/Date";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IImageDetails, IImageLayer } from "../../Contracts/Types";
import * as Resources from "../../Resources";
import { defaultColumnRenderer, renderTableCell } from "../Common/KubeCardWithTable";
import { Tags } from "../Common/Tags";
import { Scenarios } from "../Constants";
import { getTelemetryService, KubeFactory } from "../KubeFactory";
import { getRunDetailsText } from "../RunDetails";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ImageDetails.scss";
import { Button } from "azure-devops-ui/Button";

export interface IImageDetailsProperties extends IVssComponentProperties {
    imageDetails: IImageDetails;
    onBackButtonClick?: () => void;
}

export interface IImageDetailsState {

}

export class ImageDetails extends React.Component<IImageDetailsProperties, IImageDetailsState> {

    constructor(props: IImageDetailsProperties) {
        super(props);
        getTelemetryService().scenarioStart(Scenarios.ImageDetails);
    }
    public render(): JSX.Element {
        return (
            <Page className="image-details-content flex flex-grow">
                {this._getMainHeading()}
                <div className="pod-details-right-content page-content page-content-top">
                    {this._getImageDetails()}
                    {this._getImageLayers()}
                </div>
            </Page>
        );
    }

    public componentDidMount(): void {
        getTelemetryService().scenarioEnd(Scenarios.ImageDetails);
    }

    private _getMainHeading(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        this._displayImageName = Utils.extractDisplayImageName(imageDetails.imageName);
        this._labels = this._getImageLabels(imageDetails.layerInfo);
        const runUrl = this._constructPipelineRunUrl(this._labels, imageDetails.runId);
        const pipelineDetails = {
            jobName: imageDetails.jobName,
            pipelineName: imageDetails.pipelineName,
            runName: imageDetails.pipelineVersion,
            runUrl: runUrl
        };
        const imageCreatedOn = imageDetails.createTime ? new Date(imageDetails.createTime) : new Date();
        const agoTime = Date_Utils.ago(imageCreatedOn, Date_Utils.AgoFormat.Compact);
        const jobName = getRunDetailsText(undefined, pipelineDetails, agoTime);
        return (
            <CustomHeader className="image-details-header">
                <HeaderIcon
                    className="bolt-table-status-icon-large"
                    iconProps={{ iconName: "Back", onClick: this.props.onBackButtonClick, className: "image-details-back-button" }}
                    titleSize={TitleSize.Large}
                />
                <HeaderTitleArea>
                    <HeaderTitleRow>
                        <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large} >
                            {this._displayImageName}
                        </HeaderTitle>
                    </HeaderTitleRow>
                    <HeaderDescription className={"text-ellipsis"}>
                        {jobName}
                    </HeaderDescription>
                </HeaderTitleArea>
                <Button
                    className="image-details-export-button"
                    text={Resources.ImageDetailsExportText}
                    tooltipProps={{ text: Resources.ImageDetailsExportTooltip }}
                    onClick={() => {
                        this._downloadImageProvenance(imageDetails.imageName);
                    }}
                />
            </CustomHeader>
        );
    }

     private _downloadImageProvenance(imageName: string): void {
        const imageService = KubeFactory.getImageService();
        imageService && imageService.getImageProvenances([imageName]).then(imageProvenances => {
            if (imageProvenances && imageProvenances.length > 0) {
                const imageProvenance = JSON.stringify(imageProvenances[0]);
                const exportedFileName = imageName.concat(".json");
                this._saveToFile(imageProvenance, exportedFileName);
            }
        });
    }

    private _saveToFile(str: string, fileName: string): void {
        const file = new Blob([str], { type: "application/json" });

        //needed for IE10
        if (window.navigator && window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(file, fileName);
        }
        else {
            // refer to the link http://stackoverflow.com/questions/31214677/download-a-reactjs-object-as-a-file for details
            // There is a package react-file-download (https://www.npmjs.com/package/react-file-download), but we do not have this 
            // downloaded in our repo.
            //
            // So we are using this approach as has been answered in the stack overflow thread mentioned above
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.href = URL.createObjectURL(file);
            a.setAttribute("download", fileName);
            a.click();
        }
    }

    private _getImageDetails(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;

        return (
            <CustomCard className="image-details-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Medium}>
                                {Resources.ImageDetailsHeaderText}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent className="image-full-details-table" contentPadding={true}>
                    {this._getCardContent()}
                </CardContent>
            </CustomCard>
        );
    }

    private _getImageDetailsRowsData(imageDetails: IImageDetails): any[] {
        let imageDetailsRows: any[] = [];
        const digest: string = Utils.getDigestFromImageResourceUrl(imageDetails.imageUri);
        const imageType: string = imageDetails.imageType || "";
        const mediaType: string = imageDetails.mediaType || "";
        const registryName: string = this._getRegistryName();
        const imageSize: string = imageDetails.imageSize;
        const labels: string[] = this._labels;
        const tags: string[] = imageDetails.tags || [];

        digest && imageDetailsRows.push({ key: Resources.DigestText, value: digest });
        imageType && imageDetailsRows.push({ key: Resources.ImageTypeText, value: imageType });
        tags && tags.length > 0 && imageDetailsRows.push({ key: Resources.TagsText, value: tags });
        mediaType && imageDetailsRows.push({ key: Resources.MediaTypeText, value: mediaType });
        registryName && imageDetailsRows.push({ key: Resources.RegistryText, value: registryName });
        imageSize && imageDetailsRows.push({ key: Resources.ImageSizeText, value: imageSize });
        labels && labels.length > 0 && imageDetailsRows.push({ key: Resources.LabelsText, value: labels });

        return imageDetailsRows;
    }

    private static _renderValueCell = (tableItem: any) => {
        const { key, value } = tableItem;
        switch (key) {
            case Resources.LabelsText:
            case Resources.TagsText:
                return (
                    <div className="text-ellipsis details-card-value-field-size">
                        <Tags items={value} className="body-s" showOnlyValues={true} />
                    </div>
                );

            default:
                return defaultColumnRenderer(value, "details-card-value-field-size");
        }
    }

    private _getCardContent = (): JSX.Element => {
        const items = this._getImageDetailsRowsData(this.props.imageDetails);
        const rowClassNames = "flex-row details-card-row-size";
        return (
            <div className="flex-column details-card-content body-m">
                {items.map((item, index) => (
                    <div className={index === 0 ? css(rowClassNames, "first-row") : rowClassNames} key={index}>

                        <div className="text-ellipsis secondary-text details-card-info-field-size">
                            {item.key}
                        </div>
                        {ImageDetails._renderValueCell(item)}
                    </div>))
                }
            </div>
        );
    }

    private _getImageLayers(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        const layerInfo = this._sortByCreatedDate(imageDetails.layerInfo);
        const tableProps = {
            id: "image-layers-table",
            role: "table",
            showHeader: true,
            showLines: true,
            singleClickActivation: false,
            itemProvider: new ArrayItemProvider<IImageLayer>(layerInfo),
            ariaLabel: Resources.LayersText,
            columns: ImageDetails._getImageLayersColumns(),
        } as ITableProps<any>;
        return (
            <CustomCard className="image-layers-card k8s-card-padding bolt-table-card flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="image-layers-card-header text-ellipsis" titleSize={TitleSize.Medium} >
                                {Resources.LayersText}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent className="image-layer-details" contentPadding={false}>
                    <Table
                        {...tableProps}
                    />
                </CardContent>
            </CustomCard>
        );
    }

    private getTime(date?: Date) {
        return date != null ? date.getTime() : 0;
    }


    private _sortByCreatedDate(layerInfo: IImageLayer[]): IImageLayer[] {
        layerInfo.sort((a: IImageLayer, b: IImageLayer) => {
            // Most recent layer to be shown first
            return this.getTime(b.createdOn) - this.getTime(a.createdOn);
        });

        return layerInfo;
    }

    private static _getImageLayersColumns(): ITableColumn<IImageLayer>[] {
        let columns: ITableColumn<IImageLayer>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = "list-col-content";

        columns.push({
            id: "image-layer-directive-col",
            name: Resources.CommandText,
            width: -82,
            minWidth: 300,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersCommandCell
        });

        columns.push({
            id: "image-layer-size-col",
            name: Resources.SizeText,
            width: new ObservableValue(172),
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersSizeCell
        });

        columns.push({
            id: "image-layer-created-col",
            name: Resources.AgeText,
            width: -18,
            minWidth: 150,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersAgeCell
        });

        return columns;
    }

    private static _renderLayersCommandCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        const directive = imageLayer.directive || "";
        const layerArguments = imageLayer.arguments || "";
        let textToRender = "-";
        if (directive && layerArguments) {
            textToRender = localeFormat("{0}: {1}", directive, layerArguments);
        }

        const itemToRender = defaultColumnRenderer(textToRender, "body-m");
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersSizeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently size data is not present in imageLayer
        let textToRender = imageLayer.size;
        if (!textToRender || textToRender.toUpperCase() === "0B") {
            textToRender = "-";
        }

        const itemToRender = defaultColumnRenderer(textToRender, "body-m");
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently created data is not present in imageLayer
        const layerCreatedOn = imageLayer.createdOn ? new Date(imageLayer.createdOn) : new Date();
        const itemToRender = <Ago className="body-m" date={layerCreatedOn} format={AgoFormat.Compact} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _getRegistryName(): string {
        const imageParts = this._displayImageName.split("/");
        if (imageParts && imageParts.length > 0) {
            return imageParts[0];
        }

        return "";
    }

    private _getImageLabels(layerInfo: IImageLayer[]): string[] {
        let labels: string[] = [];
        for (const layer of layerInfo) {
            const directive = layer.directive;
            if (directive.toLowerCase() === "label") {
                labels.push(layer.arguments);
            }
        }

        return labels;
    }

    private _constructPipelineRunUrl(labels: string[], runId: number): string {
        // These strings are the ones that are added as labels during docker build task
        const teamFoundationCollectionUriMatch = "system.teamfoundationcollectionuri=";
        const teamProjectMatch = "system.teamproject=";
        const buildNumberMatch = "build.buildnumber=";
        const releaseWebUrlMatch = "release.releaseweburl=";
        let teamFoundationCollectionUri = "";
        let teamProject = "";
        let buildNumber = "";
        let releaseWebUrl = "";

        for (const label of labels) {
            releaseWebUrl = this._getMatchingUrlString(label, releaseWebUrlMatch);
        }

        // For release pipeline, the releaseWebUrl is added as a tag during docker build
        if (!!releaseWebUrl) {
            return releaseWebUrl;
        }

        // For build pipeline we construct url from bits found by searching each of the labels
        for (const label of labels) {
            teamFoundationCollectionUri = this._getMatchingUrlString(label, teamFoundationCollectionUriMatch);
            if (!!teamFoundationCollectionUri) {
                break;
            }
        }

        if (!teamFoundationCollectionUri) {
            return "";
        }

        for (const label of labels) {
            teamProject = this._getMatchingUrlString(label, teamProjectMatch);
            if (!!teamProject) {
                break;
            }
        }

        if (!teamProject) {
            return "";
        }

        for (const label of labels) {
            buildNumber = this._getMatchingUrlString(label, buildNumberMatch);
            if (!!buildNumber) {
                break;
            }
        }

        if (!buildNumber) {
            return "";
        }

        return format("{0}{1}/_build?buildId={2}", teamFoundationCollectionUri, teamProject, runId.toString());
    }

    private _getMatchingUrlString(label: string, match: string): string {
        const index = label.indexOf(match);
        if (index >= 0) {
            return label.substring(index + match.length, label.length);
        }

        return "";
    }

    private _displayImageName: string;
    private _labels: string[];
}
