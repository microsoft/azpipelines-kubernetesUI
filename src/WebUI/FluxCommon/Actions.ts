/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { Initializable } from "./Factory";

export type ActionListener<T> = (payload: T) => void;

export interface IEmptyActionPayload {
}

export interface IActionPayload {
}

export abstract class ActionCreatorBase extends Initializable {
}

export abstract class ActionsHubBase extends Initializable {
}

export class Action<T> {
    /**
     * A mutex to ensure that only one action is executing at any time.
     * This prevents cascading actions.
     */
    private static executing: boolean = false;

    private listeners: ActionListener<T>[] = [];

    public invoke(payload: T): void {
        if (Action.executing) {
            throw new Error("Cannot invoke an action from inside another action.");
        }

        Action.executing = true;

        try {
            this.listeners.forEach(listener => {
                listener(payload);
            });
        } finally {
            Action.executing = false;
        }
    }

    /**
     * Add listener to the action
     * @param listener Listener to add
     */
    public addListener(listener: ActionListener<T>): void {
        this.listeners.push(listener);
    }

    /**
     * Remove listener from the action
     * @param listener Listener to remove
     */
    public removeListener(listener: ActionListener<T>): void {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
            this.listeners.splice(index, 1);
        }
    }
}