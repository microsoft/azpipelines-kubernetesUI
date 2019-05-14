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
    public static setImageLocation(imageLocation?: (image: KubeImage) => string | undefined): void {
        KubeFactory._imageLocation = imageLocation;
    }

    public static getImageLocation(image: KubeImage): string | undefined {
        return KubeFactory._imageLocation ? KubeFactory._imageLocation(image) : "";
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
    private static _imageService: IImageService | undefined;
    private static _kubeService: IKubeService;
    private static _imageLocation?: (image: KubeImage) => string | undefined;
}

export function getTelemetryService(): ITelemetryService {
    return KubeFactory.getTelemetryService();
}