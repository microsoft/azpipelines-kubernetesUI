import * as React from "react";
import { configure as Enzyme_Configure } from "enzyme";
import * as EnzymeAdapter from "enzyme-adapter-react-16";

export function initializeAdapter(): void {
    Enzyme_Configure({ adapter: new EnzymeAdapter() });
}