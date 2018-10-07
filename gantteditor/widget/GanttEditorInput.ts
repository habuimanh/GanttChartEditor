import {WidgetConfigs, ICustomGridColumn, ITemplateVariable, IMenuItem} from "./interfaces/index"

export default class GanttEditorInput implements WidgetConfigs {
    public project: string;
    public projectName: string;
    public projectShowCurrentDate: string;
    public projectExcludeWeekend: string;
    public projectReadonly: string;
    public task: string;
    public taskName: string;
    public taskDescription: string;
    public taskStartDate: string;
    public taskDuration: string;
    public taskParentAssociation: string;
    public taskSortOrder: string;
    public taskStatus: string;
    public taskProgress: string;
    public taskColor: string;
    public taskProjectAssociation: string;
    public taskEditForm: string;
    public link: string;
    public linkType: string;
    public linkColor?: string;
    public linkEditForm?: string;
    public linkProjectAssociation: string;
    public linkSourceAssociation: string;
    public linkTargetAssociation: string;
    public customGridColumn?: ICustomGridColumn[];
    public customTaskTextTemplate?: string;
    public templateVariables?: ITemplateVariable[];
    public _widgetConfig: WidgetConfigs;
    public customProgressTemplate?: string;
    public customFinishFinishLinkColor: string;
    public customFinishStartLinkColor: string;
    public customStartStartLinkColor: string;
    public customStartFinishLinkColor: string;
    public menuEditTask?: boolean;
    public menuDeleteTask?: boolean;
    public customTaskContextMenu?: IMenuItem[];
    public customRowHeight?: number;

    setupMetaData() {
        this._widgetConfig = {
            project: this.project,
            projectName: this.projectName,
            projectShowCurrentDate: this.projectShowCurrentDate,
            projectExcludeWeekend: this.projectExcludeWeekend,
            projectReadonly: this.projectReadonly,
            task: this.task,
            taskName: this.taskName,
            taskDescription: this.taskDescription,
            taskStartDate: this.taskStartDate,
            taskDuration: this.taskDuration,
            taskParentAssociation: this.taskParentAssociation.split("/")[0],
            taskSortOrder: this.taskSortOrder,
            taskStatus: this.taskStatus,
            taskProgress: this.taskProgress,
            taskColor: this.taskColor,
            taskProjectAssociation: this.taskProjectAssociation.split("/")[0],
            taskEditForm: this.taskEditForm,
            link: this.link,
            linkType: this.linkType,
            linkEditForm: this.linkEditForm,
            linkProjectAssociation: this.linkProjectAssociation.split("/")[0],
            linkColor: this.linkColor,
            linkSourceAssociation: this.linkSourceAssociation.split("/")[0],
            linkTargetAssociation: this.linkTargetAssociation.split("/")[0],
            customGridColumn: this.customGridColumn,
            customTaskTextTemplate: this.customTaskTextTemplate,
            templateVariables: this.templateVariables,
            customProgressTemplate: this.customProgressTemplate,
            customFinishFinishLinkColor: this.customFinishFinishLinkColor,
            customFinishStartLinkColor: this.customFinishStartLinkColor,
            customStartStartLinkColor: this.customStartStartLinkColor,
            customStartFinishLinkColor: this.customStartFinishLinkColor,
            menuDeleteTask: this.menuDeleteTask,
            menuEditTask: this.menuEditTask,
            customTaskContextMenu: this.customTaskContextMenu,
            customRowHeight: this.customRowHeight,
        }
    }
}