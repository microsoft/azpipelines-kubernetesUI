import { KubeImage } from "../Contracts/Contracts";

export class KubeFactory {
    public static getImageLocation = (image: KubeImage): string | undefined => {
        return KubeFactory._imageLocations.get(image);
    }

    public static markTTI = () => {
        // Default implementation: Do nothing
    }

    private static _imageLocations: Map<KubeImage, string> = new Map([
        [KubeImage.zeroData, require("../img/zero-data.svg")],
        [KubeImage.zeroResults, require("../img/zero-results.svg")],
        [KubeImage.zeroWorkloads, require("../img/zero-workloads.svg")]
    ]);
}