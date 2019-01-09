import { BaseComponent, css } from "@uifabric/utilities";
import { IColumn } from "azure-devops-ui/Components/VssDetailsList/VssDetailsList.Props";
import { Ago } from "azure-devops-ui/Ago";
import { ColumnActionsMode } from "office-ui-fabric-react/lib/DetailsList";
import * as React from "react";
import * as Resources from "../Resources";
import { ListComponent } from "./ListComponent";
import { IVssComponentProperties } from "../Types";
import "./PodsComponent.scss";
import { V1Pod } from "@kubernetes/client-node";
import { Utils } from "../Utils";
import { StatusSize, Status } from "azure-devops-ui/Status";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { TerminalHandler } from "../../Contracts/TerminalService";
import './xterm.css';

const podNameKey:string = "pl-name-key";
const podImageKey:string = "pl-image-key";
const podStatusKey:string = "pl-status-key";
const podAgeKey:string = "pl-age-key";

export interface IPodsComponentProperties extends IVssComponentProperties {
    podsToRender:V1Pod[];
    headingText?:string;
    onClicked?:(itemName:string) => Promise<any>;
    podSSHConfig?:() => Promise<string>;
}

export interface IPodsComponentState {
    showPodLogs: boolean;
    termSvc?: TerminalHandler;
}

export class PodsComponent extends BaseComponent<IPodsComponentProperties, IPodsComponentState> {
    private podLogs: string = "";
    private termElm: HTMLDivElement | null = null;
    constructor(props: IPodsComponentProperties) {
        super(props, {});
        this.state = {
            showPodLogs: false
        };
    }
    public render(): React.ReactNode {

        return (
            <div>
                <ListComponent
                    headingText={this.props.headingText}
                    className={css("list-content", "pl-details", "depth-16")}
                    items={this.props.podsToRender}
                    columns={PodsComponent._getColumns()}
                    onRenderItemColumn={PodsComponent._onRenderItemColumn}
                    onItemInvoked={this._onPodClicked}
                />
                <div ref={ref => this.termElm = ref} ></div>
            </div>
        );
    }

    public componentWillUnmount() {
        this.podLogs = "";
    }

    private static _getColumns(): IColumn[] {
        let columns: IColumn[] = [];
        const headerColumnClassName: string = "secondary-text";
        const columnContentClassName: string = css("list-col-content");

        columns.push({
            key: podNameKey,
            name: Resources.PodsDetailsText,
            fieldName: podNameKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: css(headerColumnClassName, "first-col-header"),
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podImageKey,
            name: Resources.ImageText,
            fieldName: podImageKey,
            minWidth: 250,
            maxWidth: 250,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podStatusKey,
            name: Resources.StatusText,
            fieldName: podStatusKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        columns.push({
            key: podAgeKey,
            name: Resources.AgeText,
            fieldName: podAgeKey,
            minWidth: 80,
            maxWidth: 80,
            headerClassName: headerColumnClassName,
            columnActionsMode: ColumnActionsMode.disabled,
            className: columnContentClassName
        });

        return columns;
    }

    private static _onRenderItemColumn(pod?: V1Pod, index?: number, column?: IColumn): React.ReactNode {
        if (!pod || !column) {
            return null;
        }

        let textToRender: string | undefined;
        let colDataClassName: string = "list-col-content";
        switch (column.key) {
            case podNameKey:
                textToRender = pod.metadata.name;
                colDataClassName = css(colDataClassName, "primary-text");
                break;

            case podImageKey:
                textToRender = pod.spec.containers[0].image;
                break;

            case podStatusKey:
                return (
                    <div className={colDataClassName}>
                        <Status className={colDataClassName} {...Utils.generatePodStatusProps(pod.status)} animated={false} size={StatusSize.m} />        
                        {
                            pod.status.message?
                                <Tooltip showOnFocus={true} text={pod.status.message}>{pod.status.reason}</Tooltip>:
                                <span className="primary-text">{pod.status.phase}</span>
                        }
                    </div>
                );
            case podAgeKey:
                return(
                    <Ago date={new Date(pod.status.startTime)} />
                );
        }

        return ListComponent.renderColumn(textToRender || "", ListComponent.defaultColumnRenderer, colDataClassName);
    }

    private _onPodClicked = (item?: V1Pod, index?: number, ev?: Event) => {
        if (this.props.onClicked) {
            this.props.onClicked(item ? item.metadata.name : "").then(logs => {
                this.podLogs = logs;
                this.setState({
                    showPodLogs: true
                });
            });
            this.props.podSSHConfig && this.props.podSSHConfig().then(config => {
                this.setState({
                    termSvc: new TerminalHandler(config, this.termElm)
                });
                if (item && item.metadata.name && this.state.termSvc) {
                    this.state.termSvc.generateTTYForPod(item.metadata.name, item.spec.containers[0].name); // always sshing to first container
                }
            });
        }
    }
}
