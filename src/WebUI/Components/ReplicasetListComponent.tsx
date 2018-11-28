import React = require("react");
import { BaseComponent } from "@uifabric/utilities";
import { IVssComponentProperties } from "../Types";
import { V1ReplicaSetList, V1Pod, V1ReplicaSet, V1PodList } from "@kubernetes/client-node";
import { PodListComponent, IPodListComponentProperties } from "./PodListComponent";
import { ILabelModel, LabelGroup, WrappingBehavior } from "azure-devops-ui/Label";
import { ObservableArray } from "azure-devops-ui/Core/Observable";

export interface IReplicaSetListComponentProperties extends IVssComponentProperties {
    deploymentName?: string;
    deploymentAnnotations?: string[];
    replicaSetList?: V1ReplicaSetList;
    podsList?: V1PodList;
}

export class ReplicaSetListComponent extends BaseComponent<IReplicaSetListComponentProperties>{
    public render(): JSX.Element {
        return (
            <div className="replicaset-list">
                <div className="deployment-description dc-content">
                    <span className="deployment-name">{this.props.deploymentName}</span>
                    {this._getDeploymentAnnotations()}
                </div>                
                {this._getReplicaSetListView()}            
            </div>
        );
    }

    private _getReplicaSetListView(): JSX.Element[] {
        var replicaSetList = this.props.replicaSetList;
        var podsList = this.props.podsList;
        let replicaSetListView: JSX.Element[] = [];

        if (replicaSetList && replicaSetList.items && replicaSetList.items.length  > 0) {
            replicaSetListView = replicaSetList.items.map((r: V1ReplicaSet, index: number): JSX.Element => {
                let podListComponentProperties: IPodListComponentProperties = {
                    replicaSet: r,
                    pods: []    
                };

                if (podsList && podsList.items && podsList.items.length > 0) {
                    var pods = podsList.items.filter((p: V1Pod) => {
                            return p.metadata.ownerReferences[0]["name"] === r.metadata.name;                            
                     });

                     podListComponentProperties.pods = pods;
                }

                return (<div className="pod-list"><PodListComponent {...podListComponentProperties} /></div>);
            });
        }

        return replicaSetListView;
    }
    
    private _getDeploymentAnnotations(): React.ReactNode | null {
        var annotations = this.props.annotations;
        var labels = new ObservableArray<ILabelModel>();
        if (annotations) {
            annotations.forEach((v: string) => {
                labels.push({ content: v, color: { red: 128, green: 128, blue: 128 } });            
              });
            
              return <LabelGroup labelProps={labels} wrappingBehavior={WrappingBehavior.FreeFlow} fadeOutOverflow />;
        }
        
        return null;
    }
}