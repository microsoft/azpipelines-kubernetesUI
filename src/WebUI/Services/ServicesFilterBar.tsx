/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ServiceList } from "@kubernetes/client-node";

import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { KubeFilterBar } from "../Common/KubeFilterBar";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { IListSelection, ListSelection } from "azure-devops-ui/List";

export interface IServiceFilterBarProps extends IVssComponentProperties {
    filter: Filter;
    filterToggled: ObservableValue<boolean>;
    serviceList: V1ServiceList;
}

export class ServicesFilterBar extends React.Component<IServiceFilterBarProps> {
    public render(): React.ReactNode {
        const svcTypes = this._generateSvcTypes();
        let items: IListBoxItem<{}>[] = [];
        for (const svc of svcTypes) {
            let item = {
                id: svc,
                text: svc
            };
            items.push(item);
        };

        return (
            <KubeFilterBar filter={this.props.filter}
                pickListPlaceHolder={Resources.TypeText}
                keywordPlaceHolder={Resources.ServiceText}
                filterToggled={this.props.filterToggled}
                selection={this._selection}
                listItems={items}
                className={this.props.className || ""}
                addBottomPadding={true}
            />
        );
    }

    private _generateSvcTypes(): string[] {
        let svcTypes: string[] = [];
        this.props.serviceList && this.props.serviceList.items && this.props.serviceList.items.forEach((svc) => {
            if (svcTypes.indexOf(svc.spec.type) === -1) {
                svcTypes.push(svc.spec.type);
            }
        });

        return svcTypes;
    }

    private _selection: IListSelection = new ListSelection(true);
}