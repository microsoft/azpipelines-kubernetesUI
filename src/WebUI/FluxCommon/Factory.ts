/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

export interface INewable<T, U = undefined> {
    new (args?: U): T;
    getKey: () => string;
    initialize?: (instanceId?: string) => void;
}

export abstract class Singleton {

    constructor() {
        if (!Singleton._allowPrivateInstantiation) {
            throw new Error("Error: Instantiating an object of Singleton class is not allowed. Please use the instance method");
        }
    }

    protected static getInstance<T extends Singleton>(className: new () => T): T {
        if (!this._instance) {
            Singleton._allowPrivateInstantiation = true;
            this._instance = new className();
            Singleton._allowPrivateInstantiation = false;
        }
        return <T>this._instance;
    }

    protected static dispose(): void {
        this._instance = null;
    }

    private static _allowPrivateInstantiation: boolean = false;
    private static _instance: Singleton | null = null;
}

export class Factory {

    public static create<T, U>(className: INewable<T, U>, args?: U): T {
        return this.createObject<T, U>(className, args);
    }

    public static createObject<T, U = undefined>(className: INewable<T, U>, args?: U | null): T {
        if (args) {
            return new className(args);
        } else {
            let instance = Object.create(className.prototype);
            try {
                const constructed = instance.constructor(args);
                if (constructed) {
                    return constructed;
                } else {
                    return instance;
                }
            } catch (e) {
                return new instance.constructor(args);
            }
        }
    }
}

export abstract class KeyMonikerProvider {
    public static getKey(): string {
        throw new Error("This method needs to be implemented in derived classes");
    }
}

export abstract class Initializable extends KeyMonikerProvider {
    public abstract initialize(instanceId?: string | null): void;
}

export abstract class BaseManager<T> extends Singleton {

    constructor() {
        super();
        this._instanceMap = {};
    }

    protected dispose() {

        Object.keys(this._instanceMap).forEach((key: string) => {
            this._deleteInstance(key);
        });

        this._instanceMap = {};
    }

    protected getAllObjects(instanceClass: INewable<T, {}>): T[] {
        let instanceKey = instanceClass.getKey().toLowerCase();
        let instances: T[] = [];
        for (let instance in this._instanceMap) {
            if (this._instanceMap.hasOwnProperty(instance)) {
                if (instance.indexOf(instanceKey) === 0) {
                    instances.push(this._instanceMap[instance]);
                }
            }
        }

        return instances;
    }

    protected getObject(instanceClass: INewable<T>, instanceId: string | null | undefined): T {
        const argumentLength = instanceClass.prototype.constructor.length;
        if (argumentLength > 0) {
            let instanceKey = this._getInstanceKey(instanceClass, instanceId);
            let instance = this._instanceMap[instanceKey];
            if (!instance) {
                throw new Error("Object requested is not created yet. Ensure that the object is created before it is queried. " + instanceClass);
            }
            else {
                return instance;
            }
        }
        else {
            return this.createObject(instanceClass, instanceId, null);
        }
    }

    protected removeObject(instanceClass: INewable<T>, instanceId: string | null | undefined): void {
        let instanceKey = this._getInstanceKey(instanceClass, instanceId);
        this._deleteInstance(instanceKey);
    }

    protected createObject<U = undefined>(instanceClass: INewable<T>, instanceId: string | null | undefined, args: U | null): T {
        let instanceKey = this._getInstanceKey(instanceClass, instanceId);
        let instance = this._instanceMap[instanceKey];
        if (!instance) {
            instance = Factory.createObject(instanceClass, null);
            this.onObjectCreated(instance, instanceId);
            this._instanceMap[instanceKey] = instance;
        }

        return instance;
    }

    protected abstract onObjectCreated(instance: T, instanceId: string | null | undefined): void;

    private _getInstanceKey(instanceClass: INewable<T>, instanceId: string | null | undefined): string {
        let instanceKey: string = instanceClass.getKey();
        if (instanceId) {
            instanceKey = instanceKey + "." + instanceId;
        }

        return instanceKey.toLowerCase();
    }

    private _deleteInstance(instanceKey: string): void {
        let instance = this._instanceMap[instanceKey];
        if (instance) {
            let disposeFunc = (<any>instance).__dispose;
            if (disposeFunc && typeof disposeFunc === "function") {
                (<any>instance).__dispose();
            }

            delete this._instanceMap[instanceKey];
        }
    }

    private _instanceMap: { [key: string]: T };
}

export abstract class Manager extends BaseManager<Initializable> {

    protected onObjectCreated(instance: Initializable, instanceId: string | null | undefined) {
        instance.initialize(instanceId);
    }
}

