import { WidgetConnect } from "../connect/widgetConnect";
import { WidgetConfigs } from "../interfaces/dataInterface";
import { EVENT } from "../events/enum";
import columnConfig = require("./GridColumn");
import dhtmlx = require("../interfaces/dhtmlxInterface");
import Menu = require("dijit/Menu");
import MenuItem = require("dijit/MenuItem");
import template = require("./template");
import scales = require("./Scales");
import buttons = require("./Button");
import mapping = require("../stores/dhtmlxStoreMapping");
import extensions = require("./extension");
import "../../lib/dhtmlxgantt";

const TWO_DAYS = 24 * 3600 * 1000 * 2;

export default class ViewConfig {

    private _ganttEventHandlers: string[];
    private _menu: dijit.Menu;
    private _readonly: boolean = false;
    private _contextMenu: HTMLDivElement;

    constructor(
        private _viewConfig: WidgetConfigs,
        private _connect: WidgetConnect,
        private _domNode: HTMLElement,
        private _ganttContainer: HTMLElement,
        private _toolbar: HTMLElement,
    ) {
        this.configToolbar();
        this.configTimelineArea();
        this.configContextMenu();
        this.configRow();
        this.configTask();
        this.configSmartRendering();
        this.setupEvents();
        this.setupTooltip();
        this.configDragdrop();
    }

    configDragdrop() {
        gantt.config.order_branch = true;
        gantt.config.order_branch_free = true;
    }

    setupTooltip() {
        gantt.templates.tooltip_text = function (start, end, task, mousevent?: MouseEvent) {
            if (mousevent && mousevent.buttons === 1 && mousevent.which === 1) {
                gantt.templates.tooltip_text = () => "";
            }
            return "<b>Task:</b> " + task.text + "<br/><b>Start date:</b> " +
                gantt.templates.tooltip_date_format(start) +
                "<br/><b>End date:</b> " + gantt.templates.tooltip_date_format(end);
        };
    }

    configToolbar() {
        // jump to current date
        let jumpDateButton = new buttons.Button("current date", "current date", () => {
            let now = new Date();
            let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let currentDatePos = gantt.posFromDate(today);
            gantt.scrollTo(currentDatePos ? currentDatePos : 0, null);
        });
        let jumpDateGroupButton = new buttons.GroupButton([jumpDateButton], "toolbar-item");
        this._toolbar.appendChild(jumpDateGroupButton.getElement());

        // scale group button
        let groupButton = new buttons.GroupButton([], "toolbar-item");
        for (let type in scales.ScaleType) {
            let button = new buttons.Button(scales.ScaleType[type], scales.ScaleType[type], (e) => {
                scales.setScale(e.target['id']);
            })
            groupButton.addButton(button);
        }
        this._toolbar.appendChild(groupButton.getElement());
    }

    unhighlightWeekend() {
        gantt.templates.scale_cell_class = () => "";
        gantt.templates.task_cell_class = () => "";
    }

    highlightWeekend() {
        gantt.templates.scale_cell_class = (date: Date) => {
            if (date.getDay() === 0 || date.getDay() === 6) return "weekend";
            return "";
        }
        gantt.templates.task_cell_class = (task, date: Date) => {
            task; // just for preventing typings error
            if (date.getDay() === 0 || date.getDay() === 6) return "weekend";
            return "";
        }
    }

    configTimelineArea() {
        gantt.config.smart_rendering = true;
        scales.selectDayScale();
        if (this._viewConfig.customRowHeight) {
            gantt.config.row_height = this._viewConfig.customRowHeight;
        }
        this.highlightWeekend();
    }

    configTask() {
        // customize progress text
        if (this._viewConfig.customProgressTemplate) {
            gantt.templates.progress_text = (start, end, task: dhtmlx.IDHMLXTask) => {
                start && end;
                return this._viewConfig.customProgressTemplate!.replace("${}", Math.round(task.progress * 100) + "%");
            }
        }

        // customize task text
        if (!this._viewConfig.customTaskTextTemplate) return;
        let variableMapping = new Map();
        this._viewConfig.templateVariables && this._viewConfig.templateVariables.forEach(templateVariable => {
            variableMapping.set(templateVariable.name, "_" + templateVariable.attribute);
        })
        gantt.templates.task_text = (start: Date, end: Date, task: dhtmlx.IDHMLXTask) => {
            start && end;
            return template.generateTemplate(this._viewConfig.customTaskTextTemplate!, variableMapping)(task);
        }
    }

    configRow() {
        gantt.config.show_unscheduled = true;
        gantt.templates.grid_file = (task: dhtmlx.IDHMLXTask) => {
            if (task.unscheduled) return "";
            return "<div class='gantt_tree_icon gantt_file'></div>";
        }
        // gantt.templates.grid_row_class = (start, end, task: dhtmlx.IDHMLXTask) => {
        //     start && end; // for preventing typing errors
        //     if (task.unscheduled) return "hide";
        //     return "";
        // }
    }

    configByContextThenInit(context: mendix.lib.MxObject) {
        // readonly mode
        if (this._viewConfig.projectReadonly && context.get(this._viewConfig.projectReadonly)) {
            gantt.config.readonly = true;
            this._readonly = true;
        }
        this.setupGanttEvents();
        this.configGridColumn();

        // include/exclude weekend
        gantt.config.work_time = !!this._viewConfig.projectExcludeWeekend;

        // show/hide current date marker
        if (!this._viewConfig.projectShowCurrentDate) {
            gantt.init(this._ganttContainer);
            this._connect.publish(EVENT.GANTT_INITIALIZED, [context]);
            return;
        };

        // if showCurrentDate, load marker extension and show marker
        const ganttContainer = this._ganttContainer;
        extensions.loadExtension("dhtmlxgantt_marker", function () {
            this.configMarker();
            gantt.init(ganttContainer);
            this._connect.publish(EVENT.GANTT_INITIALIZED, [context]);
        }.bind(this));
    }

    configMarker() {
        let date_to_str = gantt.date.date_to_str(gantt.config.task_date);
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        gantt.addMarker({
            start_date: today,
            text: "Today",
            title: "Today: " + date_to_str(today),
        });
    }

    configSmartRendering() {
        extensions.loadExtension("dhtmlxgantt_smart_rendering");
    }

    configContextMenu() {
        this._contextMenu = document.createElement("div");
        this._domNode.appendChild(this._contextMenu);
        this._menu = new Menu(undefined, this._contextMenu);
        this._menu.domNode.classList.add("custom-context-menu");
        window.addEventListener("click", () => {
            this.hideContextMenu();
        });
        this._menu["resize"] = () => void 0;
    }
    configGridColumn() {
        gantt.config.open_tree_initially = true;
        gantt.config.grid_resize = true;
        gantt.config.min_grid_column_width = 200;
        gantt.config.keep_grid_width = false;
        if (this._viewConfig.customGridColumn && this._viewConfig.customGridColumn.length > 0) {
            gantt.config.columns = this._viewConfig.customGridColumn.map(config => columnConfig.mapToColumnConfig(config, this._viewConfig.taskName));
            gantt.config.grid_width = gantt.config.columns.reduce((width, column) => width + parseInt(column['width']), 0);
            gantt.config.grid_width += 50;
        } else {
            gantt.config.columns = columnConfig.defaultColumnConfig;
        }
        if (!this._readonly) {
            gantt.config.columns = gantt.config.columns.concat(columnConfig.customButtonsColumn);
        }
    }

    setupGanttEvents() {
        this._ganttEventHandlers instanceof Array
            && this._ganttEventHandlers.forEach(eventHandler => gantt.detachEvent(eventHandler));
        if (!this._readonly) {
            this._ganttEventHandlers = [
                gantt.attachEvent("onAfterTaskDrag", this.onDragTask.bind(this)),
                gantt.attachEvent("onTaskClick", this.onTaskClick.bind(this)),
                gantt.attachEvent("onGridHeaderClick", this.onGridHeaderClick.bind(this)),
                gantt.attachEvent("onTaskDblClick", this.onTaskDoubleClick.bind(this)),
                gantt.attachEvent("onAfterLinkAdd", this.onAddLink.bind(this)),
                gantt.attachEvent("onContextMenu", this.showContextMenu.bind(this)),
                gantt.attachEvent("onEmptyClick", this.hideContextMenu.bind(this)),
                gantt.attachEvent("onGanttScroll", this.hideContextMenu.bind(this)),
                gantt.attachEvent("onScaleClick", this.hideContextMenu.bind(this)),
                gantt.attachEvent("onLinkDblClick", this.onEditLink.bind(this)),
                gantt.attachEvent("onBeforeLightbox", this.cancelLightbox.bind(this)),
                gantt.attachEvent("onAfterTaskUpdate", this.updateTimelineArea.bind(this)),
                gantt.attachEvent("onParse", this.onParse.bind(this)),
                gantt.attachEvent("onError", this.onError.bind(this)),
                gantt.attachEvent("onRowDragEnd", this.onDropTask.bind(this))
            ];
        }
    }
    onError(e) {
        console.log(e);
    }

    onParse() {
        let minDate = new Date();
        let maxDate = new Date();
        gantt.getTaskByTime().forEach((task: dhtmlx.IDHMLXTask) => {
            let endDate = task.end_date as Date;
            if (endDate > maxDate) {
                maxDate = endDate;
            }
            let startDate = task.start_date instanceof Date ? task.start_date : new Date(task.start_date as string);
            if (startDate < minDate) {
                minDate = startDate;
            }
        });

        gantt.config.start_date = new Date(minDate.getTime() - TWO_DAYS);
        gantt.config.end_date = new Date(maxDate.getTime() + TWO_DAYS);
    }
    setupEvents() {
        this._connect.subscribeEvents([
            { topic: EVENT.SERVER_UPDATE_CONTEXT_OBJECT, context: this, method: this.configByContextThenInit },
            { topic: EVENT.DESTROY, context: this, method: this.destroy }
        ])
    }

    hideContextMenu() {
        this.setupTooltip();
        if (this._menu.domNode) {
            this._menu.domNode.style.display = "none";
        }
    }

    showContextMenu(taskId: string, linkId: string, event: MouseEvent) {
        if (!taskId && !linkId) return true;
        gantt.templates.tooltip_text = () => "";
        let x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        let y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        this._menu.getChildren().forEach(child => this._menu.removeChild(child));

        // if user clicks on a task
        if (taskId) {
            // if (event.target['className'] !== "gantt_task_content") return false;
            this._viewConfig.menuDeleteTask && this._menu.addChild(new MenuItem({
                label: "Delete",
                onClick: () => {
                    this.setupTooltip();
                    this.hideContextMenu();
                    this._connect.publish(EVENT.USER_DELETE_TASK, [taskId]);
                }
            }));
            this._viewConfig.menuEditTask && this._menu.addChild(new MenuItem({
                label: "Edit",
                onClick: () => {
                    this.setupTooltip();
                    this.hideContextMenu();
                    this._connect.publish(EVENT.USER_EDIT_TASK, [taskId]);
                }
            }));
            this._viewConfig.customTaskContextMenu && this._viewConfig.customTaskContextMenu.forEach(menuItem => {
                this._menu.addChild(new MenuItem({
                    label: menuItem.label,
                    onClick: () => {
                        this.setupTooltip();
                        this.hideContextMenu();
                        this._connect.publish(EVENT.USER_CALL_MICROFLOW, [taskId, menuItem.microflow]);
                    }
                }))
            })
        } else {
            // if user clicks on a link
            this._menu.addChild(new MenuItem({
                label: "Edit",
                onClick: () => {
                    this.setupTooltip();
                    this.hideContextMenu();
                    this._connect.publish(EVENT.USER_EDIT_LINK, [linkId]);
                }
            }));
            this._menu.addChild(new MenuItem({
                label: "Delete",
                onClick: () => {
                    this.setupTooltip();
                    this.hideContextMenu();
                    this._connect.publish(EVENT.USER_DELETE_LINK, [linkId]);
                }
            }));
        }

        this._menu.domNode.style.top = y + "px";
        this._menu.domNode.style.left = x + "px";
        this._menu.domNode.style.display = "block";
        return false;
    }

    onDropTask(id: string, target: string) {
        if (target && !target.includes("null")) {
            if (target.includes("next:")) {
                target = target.slice(5);
            }
            this._connect.publish(EVENT.USER_MOVE_TASK, [gantt.getTask(id), gantt.getTask(target)]);
        }
        else if (target && target.includes("null")) {
            this._connect.publish(EVENT.USER_MOVE_TASK, [gantt.getTask(id)]);
        }
    }
    onDragTask(id: string, type: string) {
        this.hideContextMenu();
        switch (type) {
            case "move":
            case "resize":
                this._connect.publish(EVENT.USER_CHANGE_TASK_START_DATE_AND_DURATION, [gantt.getTask(id)]);
                break;
            case "progress":
                this._connect.publish(EVENT.USER_CHANGE_TASK_PROGRESS, [gantt.getTask(id)]);
        }
    }

    onTaskClick(id: string, e: MouseEvent) {
        this.setupTooltip();
        this.hideContextMenu();
        // user click on custom button
        if (!(e.target instanceof Element) || !e.target.classList[0]) return;
        switch (e.target.classList[0]) {
            case "custom_gantt_add":
                this._connect.publish(EVENT.USER_ADD_TASK, [id]);
                return false;
            case "custom_gantt_edit":
                this._connect.publish(EVENT.USER_EDIT_TASK, [id]);
                return false;
            case "custom_gantt_remove":
                gantt.deleteTask(id);
                this._connect.publish(EVENT.USER_DELETE_TASK, [id]);
                return false;
        }
        return true;
    }

    onGridHeaderClick(headerName: string) {
        this.hideContextMenu();
        this.setupTooltip();
        // user click on 'add task' button
        if (!headerName) return false;
        if (headerName === "buttons") {
            this._connect.publish(EVENT.USER_ADD_TASK, []);
            return false;
        }
        return true;
    }

    onTaskDoubleClick(id: string, event: MouseEvent) {
        this.hideContextMenu();
        this.setupTooltip();
        // user double click on the empty task
        if (event.target['parentElement'] && (event.target['parentElement'] as HTMLElement).getAttribute("task_id") === "empty") {
            // create new task with start_date is the date being clicked
            let startDate = gantt.dateFromPos(event.clientX - (event.target['parentElement'] as HTMLElement).getBoundingClientRect().left);
            this._connect.publish(EVENT.USER_ADD_TASK, [undefined, startDate]);
        }
        this._connect.publish(EVENT.USER_EDIT_TASK, [id]);
        return true;
    }

    onAddLink(id: string, link: dhtmlx.IDHMLXLink) {
        this.setupTooltip();
        this._connect.publish(EVENT.USER_ADD_LINK, [link, id]);
        return true;
    }

    onEditLink(id: string) {
        this.hideContextMenu();
        this.setupTooltip();
        this._connect.publish(EVENT.USER_EDIT_LINK, [id]);
    }

    cancelLightbox() {
        return false;
    }

    updateTimelineArea(id: string, task: dhtmlx.IDHMLXTask) {
        id;
        let endDate = gantt.calculateEndDate(task.start_date as Date, task.duration as number, gantt.config.scale_unit);
        if (gantt.config.end_date < new Date(endDate.getTime() + TWO_DAYS)) {
            gantt.config.end_date = new Date(endDate.getTime() + TWO_DAYS);
        }
        if (gantt.config.start_date > new Date(task.start_date.getTime() - TWO_DAYS)) {
            gantt.config.start_date = new Date(task.start_date.getTime() - TWO_DAYS);
        }

        // select updated task
        task.parent && gantt.open(task.parent);
        gantt.selectTask(id);

        // make empty task always at the bottom
        gantt.deleteTask("empty");
        gantt.addTask(mapping.emptyTask, "");

        gantt.render();
    }

    destroy() {
        this._ganttEventHandlers.forEach(eventHandler => gantt.detachEvent(eventHandler));
        gantt.clearAll();
    }


}