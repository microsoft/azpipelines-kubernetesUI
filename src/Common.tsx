/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import "es6-promise/auto";
import "./Common.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

export function showRootComponent(component: React.ReactElement<any>, elementId: string = "root"): void {
    ReactDOM.render(component, document.getElementById(elementId));
}