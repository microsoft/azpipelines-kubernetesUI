/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent, css } from "@uifabric/utilities";
import { format } from "azure-devops-ui/Core/Util/String";
import { Ago } from "azure-devops-ui/Ago";
import { LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ColumnFill, ITableColumn, renderSimpleCell, SimpleTableCell as renderTableCell, Table } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Link } from "azure-devops-ui/Link";
import { Card } from "azure-devops-ui/Card";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import { StoreManager } from "../FluxCommon/StoreManager";
import { BaseKubeTable } from "../Common/BaseKubeTable";
import "./ImageDetails.scss";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { ImageDetailsStore } from "../ImageDetails/ImageDetailsStore";
import { IImageDetails, IImageLayer } from "../../Contracts/Types";

export interface IImageDetailsProperties extends IVssComponentProperties {
    imageDetails?: IImageDetails;
    onBackButtonClick?: () => void;
}

export interface IImageDetailsState {

}

export class ImageDetails extends BaseComponent<IImageDetailsProperties, IImageDetailsState> {
    public render(): JSX.Element {
        return (
            <div className="image-details-content">
                {this._getMainHeading()}
                {this._getImageDetails()}
                {this._getImageLayers()}
            </div>
        );
    }

    private _getMainHeading(): JSX.Element | null {
        const imageDetails = this.props.imageDetails || this._getDummyDataForImageDetails(); // Hard coding till we link data from image service
        return (
            <Header
                title={imageDetails.imageName}
                titleIconProps={{ iconName: "Back", onClick: this.props.onBackButtonClick, className: "image-details-back-button" }}
                titleSize={TitleSize.Large}
                className={"image-details-header"}
            />);
    }

    private _getImageDetails(): JSX.Element | null {
        const imageDetails = this.props.imageDetails || this._getDummyDataForImageDetails();
        const columns: ITableColumn<any>[] = [
            {
                id: "key",
                name: "key",
                width: new ObservableValue(150),
                className: "image-details-key",
                minWidth: 100,
                renderCell: renderSimpleCell
            },
            {
                id: "value",
                name: "value",
                width: new ObservableValue(500),
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
            { key: Resources.RegistryText, value: this._getRegistryName(imageDetails.imageUri) },
            { key: Resources.ImageSizeText, value: "" },
            { key: Resources.LabelsText, value: imageDetails.tags || "" }
        ]);

        return (
            <Card className="image-details-card depth-16"
                titleProps={{
                    text: Resources.ImageDetailsHeaderText,
                    size: TitleSize.Large
                }}
                contentProps={{ contentPadding: false }}>
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
            </Card>
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
        const imageDetails = this.props.imageDetails || this._getDummyDataForImageDetails();
        return (
            <BaseKubeTable
                headingText={Resources.LayersText}
                className={css("list-content", "pl-details", "depth-16")}
                items={imageDetails.layerInfo}
                columns={ImageDetails._getImageLayersColumns()}
                showLines={true}
            />
        );
    }

    private static _getImageLayersColumns(): ITableColumn<IImageLayer>[] {
        let columns: ITableColumn<IImageLayer>[] = [];
        const headerColumnClassName: string = "kube-col-header";
        const columnContentClassName: string = "list-col-content";

        columns.push({
            id: "image-layer-directive-col",
            name: Resources.DirectiveText,
            width: 400,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersDirectiveCell
        });

        columns.push({
            id: "image-layer-args-col",
            name: Resources.ArgumentsText,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersArgumentsCell
        });

        columns.push({
            id: "image-layer-size-col",
            name: Resources.SizeText,
            width: 256,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersSizeCell
        });

        columns.push({
            id: "image-layer-created-col",
            name: Resources.AgeText,
            width: -100,
            headerClassName: headerColumnClassName,
            className: columnContentClassName,
            renderCell: ImageDetails._renderLayersAgeCell
        });

        return columns;
    }

    private static _renderLayersDirectiveCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        const textToRender = imageLayer.directive || "";
        const itemToRender = BaseKubeTable.renderColumn(textToRender, BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersArgumentsCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        const textToRender = imageLayer.arguments || "";
        const itemToRender = BaseKubeTable.renderColumn(textToRender, BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersSizeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently size data is not present in imageLayer
        const textToRender = "";
        const itemToRender = BaseKubeTable.renderColumn(textToRender, BaseKubeTable.defaultColumnRenderer);
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private static _renderLayersAgeCell(rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IImageLayer>, imageLayer: IImageLayer): JSX.Element {
        // Currently created data is not present in imageLayer
        const itemToRender = <Ago date={new Date()} />;
        return BaseKubeTable.renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _getDummyDataForImageDetails(): IImageDetails {
        return {
            imageName: "azure-vote-front",
            imageUri: "https://microsoft/azure-vote-front@sha256:9ace3ce43db1505091c11d15edce7b520cfb598d38402be254a3024146920859",
            hash: "sha256:9ace3ce43db1505091c11d15edce7b520cfb598d38402be254a3024146920859",
            baseImageName: "azure-vote-front",
            imageType: "Docker Manifest, Schema 2",
            mediaType: "application/vdn.docker.distribution.manifest.v2+json",
            tags: ["482-production"],
            layerInfo: [{
                directive: "file",
                arguments: "9ace3ce43db1505091c11d15edce7b520cfb598d38402be254a3024146920859"
            },
            {
                directive: "file",
                arguments: "9ace3ce43db1505091c11d15edce7b520cfb598d38402be254a3024146920859"
            }],
            buildId: 1,
            buildVersion: "",
            buildDefinitionName: "",
            buildDefinitionId: "1"
        }
    }

    private _getRegistryName(imageUri: string): string {
        const imageUriParts = imageUri.split("\//");
        if (imageUriParts && imageUriParts.length >= 2) {
            const indexOfSeparator = imageUriParts[1].indexOf("\/");
            return (indexOfSeparator >= 0 && imageUriParts[1].substring(0, indexOfSeparator)) || "";
        }

        return "";
    }
}