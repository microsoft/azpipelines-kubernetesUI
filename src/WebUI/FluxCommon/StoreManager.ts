/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { Manager, INewable, Initializable } from "./Factory";

export class StoreManager extends Manager {

    /**
     * Get an instance of the Store. 
     */
    public static GetStore<T extends Initializable>(storeClass: INewable<T>, instanceId?: string): T {
        return super.getInstance<StoreManager>(StoreManager).getObject(storeClass, instanceId) as T;
    }

    public static CreateStore<T extends Initializable, U>(storeClass: INewable<T>, instanceId: string, args: U): T {
        return super.getInstance<StoreManager>(StoreManager).createObject<U>(storeClass, instanceId, args) as T;
    }

    public static DeleteStore<T extends Initializable>(storeClass: INewable<T>, instanceId?: string): void {
        super.getInstance<StoreManager>(StoreManager).removeObject(storeClass, instanceId);
    }

    public static dispose() {
        return super.getInstance<StoreManager>(StoreManager).dispose();
    }
}

