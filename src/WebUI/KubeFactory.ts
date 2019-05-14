import { IImageService, IKubeService, ITelemetryService, KubeImage } from "../Contracts/Contracts";

class DefaultTelemetryService implements ITelemetryService {
    public markTimeToInteractive(scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined): void {
        console.log(`Scenario ready for interaction ${scenarioName}, properties:${JSON.stringify(additionalProperties || {})}`);
    }

    public onClickTelemetry(source: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Item clicked  ${source}, properties:${JSON.stringify(additionalProperties || {})}`);
    }

    scenarioStart(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Scenario started ${scenarioName}, properties:${JSON.stringify(additionalProperties || {})}`);
    }

    scenarioEnd(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Scenario completed ${scenarioName}, properties:${JSON.stringify(additionalProperties || {})}`);
    }
}

export class KubeFactory {
    public static getImageLocation = (image: KubeImage): string | undefined => {
        return KubeFactory._imageLocations.get(image) || KubeFactory._imageLocations.get(KubeImage.zeroData);
    }

    public static markTTI = (scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined) => {
        getTelemetryService().markTimeToInteractive(scenarioName, additionalProperties);
    }

    public static setTelemetryService(telemetryService?: ITelemetryService): void {
        if (telemetryService) {
            KubeFactory._telemetryService = telemetryService;
        }
    }

    public static getTelemetryService(): ITelemetryService {
        if (!KubeFactory._telemetryService) {
            KubeFactory._telemetryService = new DefaultTelemetryService();
        }
        return KubeFactory._telemetryService;
    }

    public static setImageService(imageService: IImageService | undefined): void {
        KubeFactory._imageService = imageService;
    }

    public static getImageService(): IImageService | undefined {
        return KubeFactory._imageService;
    }

    public static setKubeService(kubeService: IKubeService): void {
        KubeFactory._kubeService = kubeService;
    }

    public static getKubeService(): IKubeService {
        return KubeFactory._kubeService;
    }

    private static _telemetryService?: ITelemetryService;

    private static _imageLocations: Map<KubeImage, string> = new Map([
        [KubeImage.zeroData, require("../img/zero-data.svg")],
        [KubeImage.zeroResults, require("../img/zero-results.svg")],
        [KubeImage.zeroWorkloads, require("../img/zero-workloads.svg")],
        [KubeImage.resourceDeleted, require("../img/zero-data.svg")],
        [KubeImage.resourceAccessDenied, require("../img/zero-data.svg")],
    ]);

    private static _imageService: IImageService | undefined;
    private static _kubeService: IKubeService;
}

export function getTelemetryService(): ITelemetryService {
    return KubeFactory.getTelemetryService();
}