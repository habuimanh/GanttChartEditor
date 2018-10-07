export class GanttChartData {
    constructor(
        public project: mendix.lib.MxObject,
        public tasks: mendix.lib.MxObject[],
        public links: mendix.lib.MxObject[],
    ){}
}

export interface WidgetConfigs {
    project: string;
    projectName: string;
    projectShowCurrentDate?: string;
    projectExcludeWeekend?: string;
    projectReadonly?: string;
    task: string;
    taskName: string;
    taskDescription: string;
    taskStartDate: string;
    taskDuration: string;
    taskParentAssociation: string;
    taskSortOrder: string;
    taskStatus: string;
    taskProgress: string;
    taskProjectAssociation: string;
    taskColor: string,
    taskEditForm: string,
    link: string;
    linkType: string;
    linkColor?: string;
    linkEditForm?: string;
    linkProjectAssociation: string;
    linkSourceAssociation: string;
    linkTargetAssociation: string;
    customRowHeight?: number;
    customFinishFinishLinkColor: string;
    customFinishStartLinkColor: string;
    customStartStartLinkColor: string;
    customStartFinishLinkColor: string;
    customGridColumn?: ICustomGridColumn[];
    customProgressTemplate?: string;
    customTaskTextTemplate?: string;
    templateVariables?: ITemplateVariable[];
    menuEditTask?: boolean;
    menuDeleteTask?: boolean;
    customTaskContextMenu?: IMenuItem[];
}

export interface IMenuItem {
    label: string;
    microflow: string;
}

export interface ITemplateVariable {
    name: string,
    attribute: string,
    type: string,
}

export interface ICustomGridColumn {
    attribute: string,
    label?: string,
    template?: string,
    type: string,
    width?: number,
    align?: string,
}

export interface IViewConfig {
    gridColumn?: ICustomGridColumn[];
}

export interface IAdditionalAttribute {
    name: string,
    type: string,
}