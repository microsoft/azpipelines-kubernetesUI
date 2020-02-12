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

describe("Utils getPillTags count Tests", () => {
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

describe("Utils getPillTags value check Tests", () => {
    const getPillTagsData = [
        [
            "oneLabel value",
            { "one": "oneLabel" },
            ["one=oneLabel"]
        ],
        [
            "twoLabels value",
            {
                "second": "secondLabel",
                "one": "oneLabel"
            },
            ["second=secondLabel", "one=oneLabel"]
        ],
        [
            "space with quotes value",
            {
                "second": "secondLabel\"     ",
                "one": "      oneLabel",
                "three": "      '\"three   \"  Label'\"            ",
                "four": "\"fourLable\"",
                "five": "'fiveLable'",
                "six": "\"'sixLabel\"'"
            },
            ["second=secondLabel", "one=oneLabel", "three=three   \"  Label", "four=fourLable", "five=fiveLable", "six=sixLabel"]
        ]
    ];

    it.each(getPillTagsData)("getPillTags checking for:: %s", (testName, items, output) => {
        Utils.getPillTags(items).forEach((item, index) => { expect(item).toStrictEqual(output[index]); });
    });
});

describe("Utils isDeepEquals Tests", () => {
    const isDeepEquals = [
        [
            "null lists check",
            null,
            null,
            true
        ],
        [
            "empty lists check",
            [],
            [],
            true
        ],
        [
            "null and empty lists should be treated the same",
            null,
            [],
            true
        ],
        [
            "empty base list and non empty incoming list",
            [],
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            false
        ],
        [
            "same base list and compare list",
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            true
        ],
        [
            "base list and compare list. no match",
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0543586" }}],
            false
        ],
        [
            "multi entry base list and compare list. data matches",
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}, { metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0543586" }}],
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0543586" }}, { metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            true
        ],
        [
            "multi entry base list and compare list. data does not match",
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536839" }}, { metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0544689" }}],
            [{ metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0543586" }}, { metadata: { uid: "0d1b96e1-64fa-11e9-92f5-963df0536256" }}],
            false
        ]
        
    ];

    it.each(isDeepEquals)("isDeepEquals checking for:: %s", (testName, baseObject, compareObject, expectedResult) => {
        expect(Utils.isDeepEquals(baseObject, compareObject)).toStrictEqual(expectedResult);
    });
});