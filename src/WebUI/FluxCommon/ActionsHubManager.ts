/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { Manager, INewable, Initializable } from "./Factory";

export class ActionsHubManager extends Manager {

    /**
     * Get an instance of actions hub. Use actions hub when there is no logic that needs to be performed as part of actions. 
     */
    public static GetActionsHub<T extends Initializable>(actionsHubClass: INewable<T>, instanceId?: string): T {
        return super.getInstance<ActionsHubManager>(ActionsHubManager).getObject(actionsHubClass, instanceId) as T;    
    }

    /**
     * Get all instances of the actions hub for the class. This is used by unit tests to raise actions that changes stores deep in the
     * hierarchy.
     */
    public static GetAllActionsHub<T extends Initializable>(actionsHubClass: INewable<T, {}>): T[] {
        return super.getInstance<ActionsHubManager>(ActionsHubManager).getAllObjects(actionsHubClass) as T[];
    }

    public static dispose() {
        return super.getInstance<ActionsHubManager>(ActionsHubManager).dispose();
    }
}