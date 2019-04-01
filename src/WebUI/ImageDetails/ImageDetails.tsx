/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { Ago } from "azure-devops-ui/Ago";
import { CardContent, CustomCard } from "azure-devops-ui/Card";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { CustomHeader, HeaderIcon, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from "azure-devops-ui/Header";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { Page } from "azure-devops-ui/Page";
import { ColumnFill, ITableColumn, SimpleTableCell as renderSimpleTableCell, Table, TableColumnStyle } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { IImageDetails, IImageLayer } from "../../Contracts/Types";
import { renderTableCell, defaultColumnRenderer } from "../Common/KubeCardWithTable";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ImageDetails.scss";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ObservableValue } from "azure-devops-ui/Core/Observable";

export interface IImageDetailsProperties extends IVssComponentProperties {
    imageDetails: IImageDetails;
    onBackButtonClick?: () => void;
}

export interface IImageDetailsState {

}

export class ImageDetails extends BaseComponent<IImageDetailsProperties, IImageDetailsState> {
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

    private _getMainHeading(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        this._displayImageName = Utils.extractDisplayImageName(imageDetails.imageName);
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
                </HeaderTitleArea>
            </CustomHeader>
        );
    }

    private _getImageDetails(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        const columns: ITableColumn<any>[] = [
            {
                id: "key",
                name: "key",
                width: new ObservableValue(150),
                className: "image-details-key",
                columnStyle: TableColumnStyle.Tertiary,
                renderCell: ImageDetails._renderKeyCell
            },
            {
                id: "value",
                name: "value",
                width: -100,
                className: "image-details-value",
                minWidth: 400,
                renderCell: ImageDetails._renderValueCell
            },
            ColumnFill
        ];

        const tableItems = this._getImageDetailsRowsData(imageDetails);

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
                <CardContent className="image-full-details-table" contentPadding={false}>
                    <Table
                        className="image-details-table"
                        id={format("image-details-{0}", imageDetails.hash)}
                        showHeader={false}
                        showLines={false}
                        singleClickActivation={false}
                        itemProvider={tableItems}
                        pageSize={tableItems.length}
                        columns={columns}
                    />
                </CardContent>
            </CustomCard>
        );
    }

    private _getImageDetailsRowsData(imageDetails: IImageDetails): ArrayItemProvider<any> {
        let imageDetailsRows: any[] = [];
        const digest: string = imageDetails.hash || "";
        const imageType: string = imageDetails.imageType || "";
        const mediaType: string = imageDetails.mediaType || "";
        const registryName: string = this._getRegistryName();
        const imageSize: string = ""; // ToDo: Size is currently not available in imageDetails.
        const labels: string[] = imageDetails.tags || [];
        const jobName: string = format("#{0} on {1}", imageDetails.buildId || "", imageDetails.buildDefinitionName || ""); // ToDo: JobName is currently not available in imageDetails.

        digest && imageDetailsRows.push({ key: Resources.DigestText, value: digest });
        imageType && imageDetailsRows.push({ key: Resources.ImageTypeText, value: imageType });
        mediaType && imageDetailsRows.push({ key: Resources.MediaTypeText, value: mediaType });
        registryName && imageDetailsRows.push({ key: Resources.RegistryText, value: registryName });
        imageSize && imageDetailsRows.push({ key: Resources.ImageSizeText, value: imageSize });
        labels && labels.length > 0 && imageDetailsRows.push({ key: Resources.LabelsText, value: labels });
        jobName && imageDetailsRows.push({ key: Resources.JobText, value: jobName });

        return new ArrayItemProvider<any>(imageDetailsRows);
    }

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        let props: any = {};
        const contentClassName = "image-o-v-col-content";
        switch (key) {
            case Resources.LabelsText:
                props = {
                    columnIndex: columnIndex,
                    children:
                    <LabelGroup
                        labelProps={Utils.getUILabelModelArray(value)}
                        wrappingBehavior={WrappingBehavior.freeFlow}
                    />,
                    tableColumn: tableColumn,
                    contentClassName: css(contentClassName, "image-labelgroups")
                };

                return renderSimpleTableCell(props);

            default:
                const itemToRender = <span className="image-details-value-cell">{value}</span>;
                return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
        }
    }

    private static _renderKeyCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key } = tableItem;
        const contentClassName = "image-o-k-col-content";

        const itemToRender = (
            <Tooltip text={key} overflowOnly>
                <span className={css("text-ellipsis")}>{key}</span>
            </Tooltip>
        );

        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender, undefined, contentClassName);
    }

    private _getImageLayers(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        return (
            <CustomCard className="image-layers-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
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
                        id="image-layers-table"
                        itemProvider={new ArrayItemProvider<IImageLayer>(imageDetails.layerInfo)}
                        columns={ImageDetails._getImageLayersColumns()}
                        showHeader={true}
                        showLines={true}
                    />
                </CardContent>
            </CustomCard>
        );
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

        const itemToRender = defaultColumnRenderer(textToRender);
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersSizeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently size data is not present in imageLayer
        const textToRender = "-";
        const itemToRender = defaultColumnRenderer(textToRender);
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently created data is not present in imageLayer
        const itemToRender = <Ago date={new Date()} format={AgoFormat.Extended} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _getRegistryName(): string {
        const imageParts = this._displayImageName.split("/");
        if (imageParts && imageParts.length > 0) {
            return imageParts[0];
        }

        return "";
    }

    private _displayImageName: string;
}