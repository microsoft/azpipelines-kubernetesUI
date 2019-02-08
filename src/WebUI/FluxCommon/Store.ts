/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

export interface IStoreState { }

export interface IEventHandler extends Function { }

/**
 * @brief Common class for base store
 */
export abstract class StoreBase {

    constructor(changedEvent?: string) {
        this.changedEvent = changedEvent || "DefaultChangeEvent";
        this.handlers = {};
    }

    /**
     * @brief This method returns an unique key for the store. The same will be used in StoreManager to store in the Dictionary
     */
    public static getKey(): string {
        throw new Error("This method needs to be implemented in derived classes");
    }

    /**
     * @brief Initializes the store
     */
    public initialize(instanceId?: string): void {
        this._instanceId = instanceId || "";
    }

    /**
     * @brief Returns the instanceId
     */
    public getInstanceId(): string | null {
        return this._instanceId;
    }

    /**
     * @brief Returns the state information preserved in store
     */
    public getState(): IStoreState {
        return {} as IStoreState;
    }

    public addChangedListener(handler: IEventHandler) {
        this.addListener(this.changedEvent, handler);
    }

    public removeChangedListener(handler: IEventHandler) {
        this.removeListener(this.changedEvent, handler);
    }

    public addListener(eventName: string, handler: IEventHandler): void {
        if (!this.handlers[eventName]) {
            this.handlers[eventName] = [];
        }
        this.handlers[eventName].push(handler);
    }

    public removeListener(eventName: string, handler: IEventHandler): void {
        if (this.handlers[eventName]) {
            for (let handlerIndex = this.handlers[eventName].length - 1; handlerIndex >= 0; handlerIndex--) {
                if (this.handlers[eventName][handlerIndex] === handler) {
                    this.handlers[eventName].splice(handlerIndex, 1);
                }
            }
        }
    }

    protected emitChanged(): void {
        this.emit(this.changedEvent, this);
    }

    protected emit(eventName: string, sender: {}): void {
        if (this.handlers[eventName]) {
            for (const handler of this.handlers[eventName]) {
                handler(sender);
            }
        }
    }

    private _dispose(): void {
        this.disposeInternal();
        this._instanceId = null;
    }

    protected abstract disposeInternal(): void;
    private _instanceId: string | null;
    private changedEvent: string;
    private handlers: { [eventName: string]: IEventHandler[] };
}
