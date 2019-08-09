import { ImageDetailsActionsCreator } from "../../../src/WebUI/ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../../../src/WebUI/ImageDetails/ImageDetailsStore";
import { StoreManager } from "../../../src/WebUI/FluxCommon/StoreManager";
import { ActionsCreatorManager } from "../../../src/WebUI/FluxCommon/ActionsCreatorManager";
import { IImageDetails } from "../../../src/Contracts/Types";
import { KubeFactory } from "../../../src/WebUI/KubeFactory";
import { MockImageService } from "../MockImageService";

describe("ImageDetailsActionsCreator getImageDetails Tests", () => {
    const mockImageDetails: IImageDetails = {
        imageName: "https://k8s.gcr.io/coredns@sha2563e2be1cec87aca0b74b7668bbe8c02964a95a402e45ceb51b2252629d608d03a",
        imageUri: "https://k8s.gcr.io/coredns@sha2563e2be1cec87aca0b74b7668bbe8c02964a95a402e45ceb51b2252629d608d03a",
        baseImageName: "k8s.gcr.io/coredns23",
        imageType: "",
        mediaType: "",
        tags: ["test-image-tag"],
        layerInfo: [{ "directive": "ADD", "arguments": "mock argument", "createdOn": new Date("2019-06-25T05:50:11+05:30"), "size": "88.9MB" }],
        runId: 1,
        pipelineVersion: "20",
        pipelineName: "test-image-pipelineName",
        pipelineId: "111",
        jobName: "test-image-jobName",
        imageSize: "1000MB",
    };

    let mockImageService = new MockImageService();
    KubeFactory.getImageService = jest.fn().mockReturnValue(mockImageService);

    const mockShowImageDetailsAction = jest.fn().mockImplementation((imageDetails: IImageDetails): void => { });

    let imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);

    beforeEach(() => {
        // Mock return value for image service getImageDetails
        mockImageService.getImageDetails = jest.fn().mockReturnValue(new Promise(() => mockImageDetails));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("If imageDetails are not defined in store then call image service", () => {
        // mock imageDetailsStore.getImageDetails
        imageDetailsStore.getImageDetails = jest.fn().mockReturnValueOnce(undefined);

        ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator).getImageDetails("test-image", mockShowImageDetailsAction);
        expect(mockImageService.getImageDetails).toHaveBeenCalledWith("test-image");
        expect(mockShowImageDetailsAction).not.toBeCalled(); // Not to be called as image details mock value is undefined here
    });

    it("If image details are present in store then do not call image service", () => {
        // mock imageDetailsStore.getImageDetails
        imageDetailsStore.getImageDetails = jest.fn().mockReturnValueOnce(mockImageDetails);

        ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator).getImageDetails("test-image", mockShowImageDetailsAction);
        expect(mockImageService.getImageDetails).not.toBeCalled();
        expect(mockShowImageDetailsAction).toBeCalledWith(mockImageDetails);
    });
});