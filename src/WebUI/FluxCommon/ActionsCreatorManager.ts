/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { Manager, INewable, Initializable } from "./Factory";

export class ActionsCreatorManager extends Manager {

    /**
     * Get an instance of the action creator. Use action creator in cases where data needs 
     * to be fetched from source before invoking an action.
     */
    public static GetActionCreator<T extends Initializable>(actionCreatorClass: INewable<T>, instanceId?: string): T {
        return super.getInstance<ActionsCreatorManager>(ActionsCreatorManager).getObject(actionCreatorClass, instanceId) as T;
    }

    public static CreateActionCreator<T extends Initializable, U>(actionCreatorClass: INewable<T>, instanceId: string, args: U): T {
        return super.getInstance<ActionsCreatorManager>(ActionsCreatorManager).createObject<U>(actionCreatorClass, instanceId, args) as T;
    }

    public static DeleteActionCreator<T extends Initializable>(actionCreatorClass: INewable<T>, instanceId?: string): void {
        super.getInstance<ActionsCreatorManager>(ActionsCreatorManager).removeObject(actionCreatorClass, instanceId);
    }

    public static dispose() {
        return super.getInstance<ActionsCreatorManager>(ActionsCreatorManager).dispose();
    }
}