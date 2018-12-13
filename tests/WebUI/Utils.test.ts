import { Utils } from "../../src/WebUI/Utils";

const isOwnerMatchedData = [
    [
        "ownerMatched",
        { ownerReferences: [{ uid: "f310d74e-ebed-11e8-ac56-829606b05f65" }] },
        "f310d74e-ebed-11e8-ac56-829606b05f65",
        true
    ],
    [
        "ownerNotMatched",
        { ownerReferences: [{ uid: "f310d74e-ebed-11e8-ac56-829606b05f65" }] },
        "f310d74e-ebfd-11e8-ac56-829606b05f65",
        false
    ],
    [
        "zeroOwners",
        { ownerReferences: [] },
        "f310d74e-ebfd-11e8-ac56-829606b05f65",
        false
    ],
    [
        "moreOwnersFirstMatched",
        {
            ownerReferences: [
                { uid: "f310d74e-ebfd-11e8-ac56-829606b05f65" },
                { uid: "f310d74e-ebed-11e8-ac56-829606b05f65" }
            ]
        },
        "f310d74e-ebfd-11e8-ac56-829606b05f65",
        true
    ],
    [
        "moreOwnersFirstNotMatched",
        {
            ownerReferences: [
                { uid: "f310d74e-ebed-11e8-ac56-829606b05f65" },
                { uid: "f310d74e-ebfd-11e8-ac56-829606b05f65" }
            ]
        },
        "f310d74e-ebfd-11e8-ac56-829606b05f65",
        false
    ],
];

describe("Utils isOwnerMatched Tests", () => {
    it.each([isOwnerMatchedData])("isOwnerMatched checking for:: %s", (t, o, owner, res) => {
        expect(Utils.isOwnerMatched(o, owner)).toEqual(res);
    });
});
