import { KubeImage, ITelemetryService } from "../Contracts/Contracts";

export class KubeFactory {
    public static getImageLocation = (image: KubeImage): string | undefined => {
        return KubeFactory._imageLocations.get(image) || KubeFactory._imageLocations.get(KubeImage.zeroData);
    }

    public static markTTI = (scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined) => {
        getTelemetryService().markTimeToInteractive(scenarioName, additionalProperties);
    }

    public static setTelemetryService(telemetryService?: ITelemetryService){
        if(telemetryService) {
            KubeFactory.telemetryService = telemetryService;
        }
    }

    public static getTelemetryService(): ITelemetryService {
        if(!KubeFactory.telemetryService) {
            KubeFactory.telemetryService = new DefaultTelemetryService();
        }
        return KubeFactory.telemetryService;
    }

    private static telemetryService?: ITelemetryService;

    private static _imageLocations: Map<KubeImage, string> = new Map([
        [KubeImage.zeroData, require("../img/zero-data.svg")],
        [KubeImage.zeroResults, require("../img/zero-results.svg")],
        [KubeImage.zeroWorkloads, require("../img/zero-workloads.svg")],
        [KubeImage.resourceDeleted, require("../img/zero-data.svg")],
        [KubeImage.resourceAccessDenied, require("../img/zero-data.svg")],
    ]);
}

export function getTelemetryService(): ITelemetryService {
    return KubeFactory.getTelemetryService();
}

class DefaultTelemetryService implements ITelemetryService {
    public markTimeToInteractive(scenarioName: string, additionalProperties?: { [key: string]: any; } | undefined): void {
        console.log(`Scenario ready for interaction ${scenarioName}, properties:${JSON.stringify(additionalProperties||{})}`);
    }

    public onClickTelemetry(source: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Item clicked  ${source}, properties:${JSON.stringify(additionalProperties||{})}`);
    }

    scenarioStart(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Scenario started ${scenarioName}, properties:${JSON.stringify(additionalProperties||{})}`);
    }

    scenarioEnd(scenarioName: string, additionalProperties?: { [key: string]: any; }): void {
        console.log(`Scenario completed ${scenarioName}, properties:${JSON.stringify(additionalProperties||{})}`);
    }
}