/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1Service, V1ServiceList } from "@kubernetes/client-node";
import { Ago } from "azure-devops-ui/Ago";
import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ScreenBreakpoints } from "azure-devops-ui/Core/Util/Screen";
import * as Utils_Accessibility from "azure-devops-ui/Core/Util/Accessibility";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, ITableRow, renderSimpleCell, Table, TwoLineTableCell, ITableProps } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import * as Resources from "../../Resources";
import { renderExternalIpCell, renderTableCell } from "../Common/KubeCardWithTable";
import { KubeZeroData } from "../Common/KubeZeroData";
import { SelectedItemKeys } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { SelectionActionsCreator } from "../Selection/SelectionActionCreator";
import { ISelectionPayload } from "../Selection/SelectionActions";
import { IServiceItem, IVssComponentProperties } from "../Types";
import { Utils } from "../Utils";
import "./ServiceDetails.scss";
import { getServiceItems } from "./ServiceUtils";

const loadBalancerKey: string = "LoadBalancer";

export interface IServicesComponentProperties extends IVssComponentProperties {
    typeSelections: string[];
    serviceList: V1ServiceList;
    nameFilter?: string;
}

export interface IServicesTableState {
    copiedRowIndex: number;
}

export class ServicesTable extends React.Component<IServicesComponentProperties, IServicesTableState> {
    constructor(props: IServicesComponentProperties) {
        super(props, {});

        this.state = {
            copiedRowIndex: -1
        };

        this._selectionActionCreator = ActionsCreatorManager.GetActionCreator<SelectionActionsCreator>(SelectionActionsCreator);
    }

    public render(): React.ReactNode {
        const filteredSvc: V1Service[] = (this.props.serviceList && this.props.serviceList.items || [])
            .filter((svc) => {
                return this._filterService(svc);
            });

        if (filteredSvc.length > 0) {
            const serviceItems = getServiceItems(filteredSvc).map((item, index) => {
                item.externalIPTooltip = index === this.state.copiedRowIndex ? Resources.CopiedExternalIp : Resources.CopyExternalIp;
                return item;
            });
            const tableProps = {
                id: "services-list-table",
                role: "table",
                showHeader: true,
                showLines: true,
                singleClickActivation: true,
                itemProvider: new ArrayItemProvider<IServiceItem>(serviceItems),
                ariaLabel: Resources.PivotServiceText,
                columns: this._columns,
                tableBreakpoints: [
                    {
                        breakpoint: ScreenBreakpoints.xsmall,
                        columnWidths: [-100, 0, 0, 0, 0]
                    },
                    {
                        breakpoint: ScreenBreakpoints.small,
                        columnWidths: [-100, 0, 175, 200, 0]
                    },
                    {
                        breakpoint: ScreenBreakpoints.medium,
                        columnWidths: [-70, 100, 100, 100, -40]
                    }
                ],
                onActivate: (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>) => {
                    this._openServiceItem(event, tableRow, serviceItems[tableRow.index]);
                }
            } as ITableProps<any>;
            return (
                <Card className="services-list-card flex-grow bolt-table-card bolt-card-no-vertical-padding"
                    contentProps={{ contentPadding: false }}>
                    <Table
                        {...tableProps}
                    />
                </Card>
            );
        } else {
            return KubeZeroData.getNoResultsZeroData();
        }
    }

    public componentDidMount(): void {
        this.props.markTTICallback && this.props.markTTICallback();
    }

    private _openServiceItem = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<any>, selectedItem: IServiceItem) => {
        if (selectedItem) {
            const payload: ISelectionPayload = {
                item: selectedItem,
                itemUID: (selectedItem.service as V1Service).metadata.uid,
                showSelectedItem: true,
                selectedItemType: SelectedItemKeys.ServiceItemKey
            };

            this._selectionActionCreator.selectItem(payload);
        }
    }

    private _renderPackageKeyCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        return ServicesTable._getServiceStatusWithName(service, columnIndex, tableColumn);
    }

    private _renderAgeCell = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IServiceItem>, service: IServiceItem): JSX.Element => {
        const itemToRender = <Ago className="body-m" date={new Date(service.creationTimestamp)} />;
        return renderTableCell(rowIndex, columnIndex, tableColumn, itemToRender);
    }

    private _setCopiedRowIndex = (copiedRowIndex: number): void => {
        this.setState({
            copiedRowIndex: copiedRowIndex
        }, () => {
            copiedRowIndex !== -1 && Utils_Accessibility.announce(Resources.CopiedExternalIp);
        });
    }

    private static _getServiceStatusWithName(service: IServiceItem, columnIndex: number, tableColumn: ITableColumn<IServiceItem>): JSX.Element {
        let statusProps: IStatusProps = Statuses.Success;
        let tooltipText: string = "";
        if (service.type === loadBalancerKey) {
            tooltipText = Resources.SucceededText;
            if (!service.externalIP) {
                tooltipText = Resources.InProgressText;
                statusProps = Statuses.Running;
            }
        }

        return (
            <TwoLineTableCell
                key={"col-" + columnIndex}
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                line1={
                    <Tooltip overflowOnly={true} text={service.package}>
                        <div className="body-m font-weight-semibold text-ellipsis">{service.package}</div>
                    </Tooltip>
                }
                line2={
                    <div className="body-s secondary-text text-ellipsis">{service.type}</div>
                }
                iconProps={{
                    render: (className?: string) => {
                        return (
                            <Tooltip text={tooltipText}>
                                <div className="flex-row">
                                    <Status {...statusProps} ariaLabel={tooltipText} className="icon-large-margin" size={StatusSize.l} />
                                </div>
                            </Tooltip>
                        );
                    }
                }}
            />
        );
    }

    private _filterService(svc: V1Service): boolean {
        const nameMatches: boolean = Utils.filterByName(svc.metadata.name, this.props.nameFilter);
        const typeMatches: boolean = this.props.typeSelections.length > 0 ? this.props.typeSelections.indexOf(svc.spec.type) >= 0 : true;

        return nameMatches && typeMatches;
    }

    private _columns = [
        // negative widths are interpreted as percentages.
        // since we want the table columns to occupy full available width, setting width - 100 which is equivalent to 100 %
        {
            id: "package",
            name: Resources.NameText,
            width: new ObservableValue(-70),
            renderCell: this._renderPackageKeyCell

        },
        {
            id: "clusterIP",
            name: Resources.ClusterIPText,
            width: new ObservableValue(-15),
            renderCell: renderSimpleCell
        },
        {
            id: "externalIP",
            name: Resources.ExternalIPText,
            width: new ObservableValue(172),
            renderCell: (rowIndex, columnIndex, tableColumn, service) => renderExternalIpCell(rowIndex, columnIndex, tableColumn, service, this._setCopiedRowIndex)
        },
        {
            id: "port",
            name: Resources.PortText,
            width: new ObservableValue(200),
            renderCell: renderSimpleCell
        },
        {
            id: "creationTimestamp",
            name: Resources.AgeText,
            width: new ObservableValue(-15),
            renderCell: this._renderAgeCell
        }
    ];

    private _selectionActionCreator: SelectionActionsCreator;
}
