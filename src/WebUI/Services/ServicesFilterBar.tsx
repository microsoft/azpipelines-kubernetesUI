/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ServiceList } from "@kubernetes/client-node";
import { BaseComponent } from "@uifabric/utilities";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { KubeFilterBar } from "../Common/KubeFilterBar";
import * as Resources from "../Resources";
import { IVssComponentProperties } from "../Types";

export interface IServiceFilterBarProps extends IVssComponentProperties {
    filter: Filter;
    filterToggled: ObservableValue<boolean>;
    serviceList: V1ServiceList;
}

export class ServicesFilterBar extends BaseComponent<IServiceFilterBarProps> {
    public render(): React.ReactNode {
        return (
            <KubeFilterBar filter={this.props.filter}
                pickListPlaceHolder={Resources.TypeText}
                keywordPlaceHolder={Resources.ServiceText}
                filterToggled={this.props.filterToggled}
                pickListItemsFn={() => this._generateSvcTypes()}
                listItemsFn={(item: any) => {
                    return {
                        key: item,
                        name: item
                    };
                }}
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
}