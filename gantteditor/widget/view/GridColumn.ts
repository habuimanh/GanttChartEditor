import configs = require("../interfaces/dataInterface");
import { IGridCollumn } from "./GridColumnInterface";
import template = require("./template");
import dhtmlx = require("../interfaces/dhtmlxInterface");

export function mapToColumnConfig(columnConfig: configs.ICustomGridColumn, taskNameConfig: string): IGridCollumn {
    return {
        label: columnConfig.label,
        name: "_" + columnConfig.attribute,
        template: columnConfig.template ?
            template.generateSingleVariableTemplate(columnConfig.template, "_" + columnConfig.attribute) :
            defaultTemplate("_" + columnConfig.attribute),
        tree: columnConfig.attribute === taskNameConfig,
        open: true,
        resize: true,
        min_width: 20,
        width: columnConfig.width ? columnConfig.width : "*",
        align: columnConfig.align,
    }
}

const colHeader = '<div class="custom_gantt_add gantt_grid_head_cell gantt_grid_head_add"></div>';

const colContent = function (task: dhtmlx.IDHMLXTask) {
    if (task.unscheduled) return "";
    return ('<i class="custom_gantt_edit custom_gantt_button glyphicon glyphicon-pencil" ></i>' +
        '<i class="custom_gantt_add custom_gantt_button glyphicon glyphicon-plus " ></i>' +
        '<i class="custom_gantt_remove custom_gantt_button glyphicon glyphicon-remove " ></i>');
};

export const customButtons = {
    name: "buttons",
    label: colHeader,
    width: 75,
    template: colContent,
}

export function defaultTemplate(name: string) {
    return (task: dhtmlx.IDHMLXTask) => {
        if (task.unscheduled) return "";
        return task[name];
    }
}

export const defaultColumnConfig: IGridCollumn[] = [
    { name: "name", label: "Task name", tree: true, width: "*", resize: true, align: "left", template: defaultTemplate("name") },
    { name: "start_date", align: "center", resize: true, template: defaultTemplate("start_date") },
    { name: "duration", align: "center", template: defaultTemplate("duration") },
];

export const customButtonsColumn = {
    name: "buttons",
    label: colHeader,
    width: 75,
    template: colContent,
}