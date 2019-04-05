/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

class KubeConsumer {
    public static setReaderComponent(reader?: (props?: any) => React.ReactNode): void {
        if (reader) {
            KubeConsumer._readerComponentFunc = reader;
        }
    }

    public static getReaderComponent(props?: any): React.ReactNode {
        if (KubeConsumer._readerComponentFunc) {
            return KubeConsumer._readerComponentFunc(props);
        }

        return null;
    }

    private static _readerComponentFunc?: (props?: any) => React.ReactNode;
}

export function getContentReaderComponent(props?: any): React.ReactNode {
    return KubeConsumer.getReaderComponent(props);
}

export function setContentReaderComponent(reader?: (props?: any) => React.ReactNode): void {
    KubeConsumer.setReaderComponent(reader);
}