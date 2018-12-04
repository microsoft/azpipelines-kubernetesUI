/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ObjectMeta } from "@kubernetes/client-node";

export class Utils {
    public static isOwnerMatched(objectMeta: V1ObjectMeta, ownerUIdLowerCase: string): boolean {
        return objectMeta.ownerReferences
          && objectMeta.ownerReferences.length > 0
          && objectMeta.ownerReferences[0].uid.toLowerCase() === ownerUIdLowerCase;
    }
}