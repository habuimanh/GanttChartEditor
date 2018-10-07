import { GanttChartData, WidgetConfigs } from "../interfaces/index";
import dhtmlx = require("../interfaces/dhtmlxInterface")
// import {toDHTMLXDate} from "../utils/StringUtils"

export function mapToDTMLXData(data: GanttChartData, configs: WidgetConfigs): dhtmlx.IDHTMLXData {
    return {
        data: data.tasks.map(task => mapTask(task, configs)).sort((task1, task2) => {
            if (task1.sortOrder > task2.sortOrder) return 1;
            if (task1.sortOrder === task2.sortOrder) return 0;
            return -1;
        }).concat(emptyTask),
        links: data.links.map(link => mapLink(link, configs)),
    }
}

export function mapLink(object: mendix.lib.MxObject, configs: WidgetConfigs): dhtmlx.IDHMLXLink {
    let result = {
        id: object.getGuid(),
        source: parseInt(object.get(configs.linkSourceAssociation) as string),
        target: parseInt(object.get(configs.linkTargetAssociation) as string),
        type: dhtmlx.IDHMLXLinkType[object.get(configs.linkType) as string],
    } as dhtmlx.IDHMLXLink;

    // calculate link color
    if (configs.linkColor && object.get(configs.linkColor)) {
        result.color = object.get(configs.linkColor) as string;
    } else {
        switch (result.type) {
            case dhtmlx.IDHMLXLinkType.Finish_Finish:
                result.color = configs.customFinishFinishLinkColor;
                break;
            case dhtmlx.IDHMLXLinkType.Finish_Start:
                result.color = configs.customFinishStartLinkColor;
                break;
            case dhtmlx.IDHMLXLinkType.Start_Start:
                result.color = configs.customStartStartLinkColor;
                break;
            case dhtmlx.IDHMLXLinkType.Start_Finish:
                result.color = configs.customStartFinishLinkColor;
                break;
        }
    }
    return result;
}

export function mapTask(task: mendix.lib.MxObject, configs: WidgetConfigs): dhtmlx.IDHMLXTask {
    // calculate parent id
    let parentId = parseInt(task.get(configs.taskParentAssociation) as string);
    if (!parentId || parentId.toString() === task.getGuid()) {
        parentId = 0;
    }

    let result = {
        id: task.getGuid(),
        color: task.get(configs.taskColor) as string,
        name: task.get(configs.taskName) as string,
        text: task.get(configs.taskDescription) as string,
        start_date: task.get(configs.taskStartDate) ? new Date(task.get(configs.taskStartDate) as string) : new Date(),
        duration: task.get(configs.taskDuration)['toPrecision']() * 1,
        progress: task.get(configs.taskProgress)['toPrecision']() * 1,
        parent: parentId,
        sortOrder: task.get(configs.taskSortOrder)['toPrecision']() * 1,
    } as dhtmlx.IDHMLXTask;

    // add custom attributes
    configs.customGridColumn && configs.customGridColumn.forEach(gridColumn =>
        mapAdditionalAttribute(task, result, gridColumn));
    configs.templateVariables && configs.templateVariables.forEach(templateVariable =>
        mapAdditionalAttribute(task, result, templateVariable));

    return result;
}

export function mapAdditionalAttribute(task: mendix.lib.MxObject, result: dhtmlx.IDHMLXTask, additionalAttr: { attribute: string, type: string }): void {
    let attrName = additionalAttr.attribute;
    switch (additionalAttr.type) {
        case "string": result["_" + attrName] = task.get(attrName) as string;
            break;
        case "number": result["_" + attrName] = task.get(attrName)['toPrecision']();
            break;
        case "dateTime": result["_" + attrName] = new Date(task.get(attrName) as string);
            break;
    }
}

export const emptyTask: dhtmlx.IDHMLXTask = {
    id: "empty",
    name: "",
    text: "",
    start_date: new Date(),
    duration: 0,
    progress: 0,
    parent: undefined,
    sortOrder: 1000,
    unscheduled: true,
}
