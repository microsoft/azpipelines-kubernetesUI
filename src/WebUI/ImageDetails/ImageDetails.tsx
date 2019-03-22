/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { format, localeFormat } from "azure-devops-ui/Core/Util/String";
import { Ago } from "azure-devops-ui/Ago";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Link } from "azure-devops-ui/Link";
import { CustomCard, CardContent } from "azure-devops-ui/Card";
import { Page } from "azure-devops-ui/Page";
import {
    CustomHeader,
    HeaderTitle,
    HeaderTitleArea,
    HeaderTitleRow,
    TitleSize,
    HeaderIcon
} from "azure-devops-ui/Header";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { StoreManager } from "../FluxCommon/StoreManager";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import "./ImageDetails.scss";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { IImageDetails, IImageLayer } from "../../Contracts/Types";

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
                {this._getImageDetails()}
                {this._getImageLayers()}
            </Page>
        );
    }

    private _getMainHeading(): JSX.Element | null {
        const imageDetails = this.props.imageDetails;
        this._displayImageName = Utils.extractDisplayImageName(imageDetails.imageName);
        return (
            <CustomHeader className="image-details-header">
                <HeaderIcon iconProps={{ iconName: "Back", onClick: this.props.onBackButtonClick, className: "image-details-back-button" }} titleSize={TitleSize.Large} />
                <HeaderTitleArea>
                    <HeaderTitleRow>
                        {
                            <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large} >
                                {this._displayImageName}
                            </HeaderTitle>
                        }
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
                width: 150,
                className: "image-details-key",
                renderCell: renderSimpleCell
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

        const tableItems = new ArrayItemProvider<any>([
            { key: Resources.DigestText, value: imageDetails.hash || "" },
            { key: Resources.TarIdText, value: "" },
            { key: Resources.ImageTypeText, value: imageDetails.imageType || "" },
            { key: Resources.MediaTypeText, value: imageDetails.mediaType || "" },
            { key: Resources.RegistryText, value: this._getRegistryName() },
            { key: Resources.ImageSizeText, value: "" },
            { key: Resources.LabelsText, value: imageDetails.tags || "" }
        ]);

        return (
            <CustomCard className="image-details-card k8s-card-padding flex-grow bolt-card-no-vertical-padding">
                <CustomHeader>
                    <HeaderTitleArea>
                        <HeaderTitleRow>
                            <HeaderTitle className="image-details-card-header text-ellipsis" titleSize={TitleSize.Medium} >
                                {Resources.ImageDetailsHeaderText}
                            </HeaderTitle>
                        </HeaderTitleRow>
                    </HeaderTitleArea>
                </CustomHeader>
                <CardContent contentPadding={false}>
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

    private static _renderValueCell(
        rowIndex: number,
        columnIndex: number,
        tableColumn: ITableColumn<any>,
        tableItem: any): JSX.Element {
        const { key, value } = tableItem;
        let props: any = {};
        switch (key) {
            case Resources.LabelsText:
                props = {
                    columnIndex: columnIndex,
                    children:
                    <LabelGroup
                        labelProps={Utils.getUILabelModelArray(value)}
                        wrappingBehavior={WrappingBehavior.oneLine}
                        fadeOutOverflow={true}
                    />,
                    tableColumn: tableColumn,
                    contentClassName: "image-labelgroups"
                };

                return renderTableCell(props);

            default:
                const itemToRender = <span className="image-details-value-cell">{value}</span>;
                return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
        }
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
                <CardContent contentPadding={false}>
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
            minWidth: 100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersCommandCell
        });

        columns.push({
            id: "image-layer-size-col",
            name: Resources.SizeText,
            width: 172,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersSizeCell
        });

        columns.push({
            id: "image-layer-created-col",
            name: Resources.AgeText,
            width: -18,
            minWidth: 100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersAgeCell
        });

        return columns;
    }

    private static _renderLayersCommandCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        const textToRender = localeFormat("{0}: {1}", imageLayer.directive || "", imageLayer.arguments || "");
        const itemToRender = BaseKubeTable.defaultColumnRenderer(textToRender);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersSizeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently size data is not present in imageLayer
        const textToRender = "";
        const itemToRender = BaseKubeTable.defaultColumnRenderer(textToRender);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently created data is not present in imageLayer
        const itemToRender = <Ago date={new Date()} />;
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
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