import { GanttChartData, WidgetConfigs } from "../interfaces/index";
import dhtmlx = require("../interfaces/dhtmlxInterface")
import { WidgetConnect } from "../connect/widgetConnect";
import { EVENT } from "../events/index";
import mapping = require("./dhtmlxStoreMapping");
import "../../lib/dhtmlxgantt";
export class DHTMLXStore {

    private _data: dhtmlx.IDHTMLXData;
    private _eventHandlers: any[];

    constructor(
        private _widgetConfigs: WidgetConfigs,
        private _connect: WidgetConnect
    ) {
        this._setupEvents();
    }

    _setupEvents() {
        this._eventHandlers = this._connect.subscribeEvents([
            { topic: EVENT.STORE_UPDATE_DATA, context: this, method: this.updateData },
            { topic: EVENT.STORE_UPDATE_TASK, context: this, method: this.updateTask },
            { topic: EVENT.STORE_ADD_TASK, context: this, method: this.addTask },
            { topic: EVENT.STORE_DELETE_TASK, context: this, method: this.deleteTask },
            { topic: EVENT.STORE_UPDATE_LINK, context: this, method: this.updateLink },
            { topic: EVENT.STORE_DELETE_LINK, context: this, method: this.deleteLink },
            { topic: EVENT.USER_DELETE_LINK, context: this, method: this.deleteLink },
            { topic: EVENT.USER_DELETE_TASK, context: this, method: this.deleteTask }
        ]);
    }

    addTask(taskObject: mendix.lib.MxObject, indexTaskFromDB: number) {
        let task = mapping.mapTask(taskObject, this._widgetConfigs);
        let taskId = gantt.addTask(task, task.parent ? task.parent.toString() : "");
        // change id to database id
        (gantt.getTask(taskId) as dhtmlx.IDHMLXTask).id = taskObject.getGuid();
        //Move new task to suitable position.
        gantt.moveTask(taskObject.getGuid(), indexTaskFromDB, mapping.mapTask(taskObject, this._widgetConfigs).parent);
        // reload gantt chart
        gantt.updateTask(taskId.toString());
        gantt.refreshData();
    }

    updateData(ganttChartData: GanttChartData) {
        this._data = mapping.mapToDTMLXData(ganttChartData, this._widgetConfigs);
        gantt.clearAll();
        gantt.parse(this._data);
    }

    updateTask(taskObject: mendix.lib.MxObject, indexTaskFromDB: number) {
        let id = taskObject.getGuid();
        if (!gantt.isTaskExists(id)) {
            this.addTask(taskObject, indexTaskFromDB);
            return;
        }
        let task: dhtmlx.IDHMLXTask = gantt.getTask(id);
        let tmpTask = mapping.mapTask(taskObject, this._widgetConfigs);
        for (let prop in tmpTask) {
            if (prop != "parent")
                task[prop] = tmpTask[prop];
        }
        task.end_date = gantt.calculateEndDate(task.start_date as Date, task.duration as number, gantt.config.scale_unit);
        gantt.moveTask(id, indexTaskFromDB, tmpTask.parent);
        // reload gantt chart
        gantt.updateTask(id);
        gantt.refreshData();
    }

    deleteTask(id: string) {
        if (gantt.isTaskExists(id)) {
            gantt.deleteTask(id);
        }
    }

    updateLink(linkObject: mendix.lib.MxObject) {
        let newLink = mapping.mapLink(linkObject, this._widgetConfigs);
        gantt.getLinks().map((link: dhtmlx.IDHMLXLink) => {
            if (link.source.toString() === newLink.source.toString()
                && link.target.toString() === newLink.target.toString()
                && link.type.toString() === newLink.type.toString()) {
                gantt.deleteLink(link.id);
            }
        })
        gantt.addLink(newLink);
    }

    deleteLink(id: string) {
        if (gantt.isLinkExists(id)) {
            gantt.deleteLink(id);
        }
    }
}