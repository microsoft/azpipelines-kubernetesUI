import { KubeImage, ITelemetryService } from "../Contracts/Contracts";

export class KubeFactory {
    public static getImageLocation = (image: KubeImage): string | undefined => {
        return KubeFactory._imageLocations.get(image) || KubeFactory._imageLocations.get(KubeImage.zeroData);
    }

    public static markTTI = (scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined) => {
        KubeFactory.telemetryService.markTimeToInteractive(scenarioName, additionalProperties);
    }

    public static telemetryService: ITelemetryService;

    private static _imageLocations: Map<KubeImage, string> = new Map([
        [KubeImage.zeroData, require("../img/zero-data.svg")],
        [KubeImage.zeroResults, require("../img/zero-results.svg")],
        [KubeImage.zeroWorkloads, require("../img/zero-workloads.svg")],
        [KubeImage.resourceDeleted, require("../img/zero-data.svg")],
        [KubeImage.resourceAccessDenied, require("../img/zero-data.svg")],
    ]);
}

export class DefaultTelemetryService implements ITelemetryService {
    public markTimeToInteractive(scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined): void {
        console.log("Scenario ready for interaction " + scenarioName);
        console.log(additionalProperties);
    }

    public onClickTelemetry(source: string, additionalProperties?: { [key: string]: any; }): void {
        console.log("Item clicked " + source);
        console.log(additionalProperties);
    }

    scenarioStart(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log("Scenario started " + scenarioName);
        console.log(additionalProperties);
    }

    scenarioEnd(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log("Scenario completed " + scenarioName);
        console.log(additionalProperties);
    }
}