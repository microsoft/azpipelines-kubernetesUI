import { Utils } from "../../src/WebUI/Utils";

describe("Utils isOwnerMatched Tests", () => {
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
            true
        ],
    ];

    it.each(isOwnerMatchedData)("isOwnerMatched checking for:: %s", (testName, metadataObj, toCheckOwner, expectedResult) => {
        expect(Utils.isOwnerMatched(metadataObj, toCheckOwner)).toStrictEqual(expectedResult);
    });
});

describe("Utils getPillTags Tests", () => {
    const getPillTagsData = [
        [
            "zeroLabels",
            {},
            0
        ],
        [
            "nullInput",
            null,
            0
        ],
        [
            "oneLabel",
            { "one": "oneLabel" },
            1
        ],
        [
            "twoLabels",
            {
                "second": "secondLabel",
                "one": "oneLabel"
            },
            2
        ]
    ];

    it.each(getPillTagsData)("getPillTags checking for:: %s", (testName, items, labelCount) => {
        expect(Utils.getPillTags(items).length).toStrictEqual(labelCount);
    });
});