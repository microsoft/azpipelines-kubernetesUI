import { localeFormat } from "azure-devops-ui/Core/Util/String";
import { KubeResourceType, KubeServiceBase } from "../../src/Contracts/KubeServiceBase";
import { IImageService } from "../../src/Contracts/Contracts";
import { IImageDetails } from "../../src/Contracts/Types";

export class MockImageService implements IImageService {
    public hasImageDetails(listImages: Array<string>): Promise<any> {
        return Promise.resolve({});
    }

    public getImageDetails(imageName: string): Promise<IImageDetails | undefined> {
        return Promise.resolve({} as IImageDetails);
    }
}