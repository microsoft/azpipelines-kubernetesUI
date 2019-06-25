import { ImageDetailsActionsCreator } from "../../../src/WebUI/ImageDetails/ImageDetailsActionsCreator";
import { ImageDetailsStore } from "../../../src/WebUI/ImageDetails/ImageDetailsStore";
import { StoreManager } from "../../../src/WebUI/FluxCommon/StoreManager";
import { ActionsCreatorManager } from "../../../src/WebUI/FluxCommon/ActionsCreatorManager";
import { IImageDetails } from "../../../src/Contracts/Types";
import { KubeFactory } from "../../../src/WebUI/KubeFactory";
import { MockImageService } from "../MockImageService";

describe("ImageDetailsActionsCreator getImageDetails Tests", () => {
    const mockImageDetails: IImageDetails = {
        imageName: "test-image",
        imageUri: "test-image-uri",
        hash: "test-image-hash",
        baseImageName: "test-image-baseImageName",
        imageType: "test-image-imageType",
        mediaType: "test-image-mediaType",
        tags: ["test-image-tag"],
        layerInfo: [{ "directive": "ADD", "arguments": "mock argument", "createdOn": new Date("2019-06-25T05:50:11+05:30"), "size": "88.9MB" }],
        runId: 1,
        pipelineVersion: "test-image-pipelineVersion",
        pipelineName: "test-image-pipelineName",
        pipelineId: "111",
        jobName: "test-image-jobName",
        imageSize: "1000MB",
    };

    it("If imageDetails are not defined in store then call image service", () => {
        // Mock return value for image service getImageDetails
        const mockImageService = new MockImageService();
        KubeFactory.getImageService = jest.fn().mockReturnValue(mockImageService);
        mockImageService.getImageDetails = jest.fn().mockReturnValue(new Promise(() => mockImageDetails));

        const mockShowImageDetailsAction = jest.fn().mockImplementation((imageDetails: IImageDetails): void => { });
        // mock imageDetailsStore.getImageDetails
        const imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
        imageDetailsStore.getImageDetails = jest.fn().mockReturnValueOnce(undefined);

        ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator).getImageDetails("test-image", mockShowImageDetailsAction);
        expect(mockImageService.getImageDetails).toHaveBeenCalledWith("test-image");
    });

    it("If image details are present in store then do not call image service", () => {
        // Mock return value for image service getImageDetails
        const mockImageService = new MockImageService();
        KubeFactory.getImageService = jest.fn().mockReturnValue(mockImageService);
        mockImageService.getImageDetails = jest.fn().mockReturnValue(new Promise(() => mockImageDetails));

        const mockShowImageDetailsAction = jest.fn().mockImplementation((imageDetails: IImageDetails): void => { });
        // mock imageDetailsStore.getImageDetails
        const imageDetailsStore = StoreManager.GetStore<ImageDetailsStore>(ImageDetailsStore);
        imageDetailsStore.getImageDetails = jest.fn().mockReturnValueOnce(mockImageDetails);
        
        ActionsCreatorManager.GetActionCreator<ImageDetailsActionsCreator>(ImageDetailsActionsCreator).getImageDetails("test-image", mockShowImageDetailsAction);
        expect(mockImageService.getImageDetails).not.toBeCalled();
    });
});