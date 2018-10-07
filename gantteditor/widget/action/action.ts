import { WidgetConnect } from "../connect/widgetConnect";
import { EVENT } from "../events/index";
import dataServices = require("../data-services/index");
import { Store } from "../stores/store";
import dhtmlx = require("../interfaces/dhtmlxInterface");
import { SubscriptionHandler } from "./subscriptionHandler";
import { WidgetConfigs } from "../interfaces/index";

// const OFFLINE_MODE = true;

export class Action {

    private _eventHandlers: any[];
    private _subscriptions: SubscriptionHandler;
    private _widgetConfigs: WidgetConfigs;

    constructor(
        private _store: Store,
        private _connect: WidgetConnect,
        private _offline: boolean
    ) {
        this._subscriptions = new SubscriptionHandler();
        this._widgetConfigs = this._store.getWidgetConfigs();
        this._setupEvents();
    }

    _setupEvents() {
        this._eventHandlers = this._connect.subscribeEvents([
            { topic: EVENT.GANTT_INITIALIZED, context: this, method: this.retrieveDataFromContextThenSubscribe },
            { topic: EVENT.USER_CHANGE_TASK_START_DATE_AND_DURATION, context: this, method: this.onChangeTaskStartDateAndDuration },
            { topic: EVENT.USER_CHANGE_TASK_PROGRESS, context: this, method: this.onChangeTaskProgress },
            { topic: EVENT.USER_ADD_TASK, context: this, method: this.onAddTask },
            { topic: EVENT.USER_EDIT_TASK, context: this, method: this.onEditObject },
            { topic: EVENT.USER_DELETE_TASK, context: this, method: this.onDeleteTask },
            { topic: EVENT.USER_ADD_LINK, context: this, method: this.onAddLink },
            { topic: EVENT.USER_DELETE_LINK, context: this, method: this.onDeleteLink },
            { topic: EVENT.USER_EDIT_LINK, context: this, method: this.onEditLink },
            { topic: EVENT.USER_CALL_MICROFLOW, context: this, method: this.onCallMicroflow },
            { topic: EVENT.USER_MOVE_TASK, context: this, method: this.onMoveTask }
        ]);
    }

    onMoveTask(taskDrag: dhtmlx.IDHMLXTask, taskTarget: dhtmlx.IDHMLXTask) {
        let taskDragObject = this._store.getObjectById(taskDrag.id);
        //Check if cannot retrieve task drag objects by id.
        if (!taskDragObject) return;
        let attributes = {};
        if (taskTarget) {
            //Find to send new sort order to database.
            let newSortOrder = this._store.findNewSortOrderOfTaskDrag(taskDrag, taskTarget);
            attributes[this._widgetConfigs.taskSortOrder] = newSortOrder;
            //If task target inside task parent, set task drag into this task parent.
            if (taskTarget.parent != 0)
                attributes[this._widgetConfigs.taskParentAssociation] = taskTarget.parent;
            //If not, user is not moving into any task parent so set task parent by this task id.
            else attributes[this._widgetConfigs.taskParentAssociation] = null;
        }
        //If task target undefined, it proves user is dragging task into new task parent which doesn't include any task children.
        else {
            attributes[this._widgetConfigs.taskParentAssociation] = taskDrag.parent;
        }
        dataServices.modifyObject(taskDragObject, attributes)
            .catch(() => dataServices.update(taskDrag.id));
    }

    retrieveDataFromContextThenSubscribe(context: mendix.lib.MxObject) {
        if (this._offline) {
            dataServices.retrieveDataOffline(context, this._widgetConfigs)
                .then((data) => {
                    [
                        ...data.links,
                        ...data.tasks
                    ].forEach(object => this._subscriptions.subscribe(object.getGuid(), this.onChangeObject.bind(this)))
                    this._connect.publish(EVENT.SERVER_UPDATE_DATA, [data]);
                })
        } else {
            dataServices.retrieveDataFromContext(context, this._widgetConfigs)
                .then((data) => {
                    [
                        ...data.links,
                        ...data.tasks
                    ].forEach(object => this._subscriptions.subscribe(object.getGuid(), this.onChangeObject.bind(this)))
                    this._connect.publish(EVENT.SERVER_UPDATE_DATA, [data]);
                })
        }
    }

    onChangeObject(guid: string) {
        dataServices.retrieveObjectById(guid)
            .then(object => {
                if (object) {
                    this._connect.publish(EVENT.SERVER_UPDATE_OBJECT, [object]);
                }
            })
    }

    onChangeTaskStartDateAndDuration(task: dhtmlx.IDHMLXTask) {
        let taskObject = this._store.getObjectById(task.id);
        if (!taskObject) return;

        let widgetConfigs = this._widgetConfigs;
        let attributes = {};
        attributes[widgetConfigs.taskDuration] = parseFloat(task.duration.toFixed(8));
        attributes[widgetConfigs.taskStartDate] = task.start_date;
        dataServices.modifyObject(taskObject, attributes)
            .catch(() => dataServices.update(task.id));
    }

    onChangeTaskProgress(task: dhtmlx.IDHMLXTask) {
        let taskObject = this._store.getObjectById(task.id);
        if (!taskObject) return;

        let attributes = {};
        attributes[this._widgetConfigs.taskProgress] = parseFloat(task.progress.toFixed(8));
        dataServices.modifyObject(taskObject, attributes)
            .catch(() => dataServices.update(task.id));
    }

    onEditObject(id: string) {
        let object = this._store.getObjectById(id);
        if (!object) return;
        dataServices.openForm(this._widgetConfigs.taskEditForm, object, object.get(this._widgetConfigs.taskName) as string);
    }

    onAddTask(parentId: string, startDate?: Date) {
        let widgetConfigs = this._widgetConfigs;
        dataServices.createEmptyObject(widgetConfigs.task)
            .then(newObject => {
                this._subscriptions.subscribe(newObject.getGuid(), this.onChangeObject.bind(this));

                newObject.set(widgetConfigs.taskProjectAssociation, this._store.getContextId());
                newObject.set(widgetConfigs.taskParentAssociation, parentId);
                newObject.set(widgetConfigs.taskSortOrder, this._store.calculateNewOrderOfChildTask(parentId));
                newObject.set(widgetConfigs.taskStartDate, startDate ? startDate.getTime() : this._store.calculateDefaultStartDate(parentId));
                newObject.set(widgetConfigs.taskName, "New Task");
                newObject.set(widgetConfigs.taskDescription, "New Task");
                newObject.set(widgetConfigs.taskDuration, 1);

                dataServices.openForm(widgetConfigs.taskEditForm, newObject, "New Task");
            })
    }

    onDeleteTask(id: string) {
        if (!this._store.getObjectById(id)) return;
        let relatedIds = [
            id,
            ...this._store.getChildrenSet(id),
            ...this._store.getTaskDependencies(id)
        ];
        Promise.all(relatedIds.map(object => dataServices.removeObject(object)))
            .then(() => {
                this._connect.publish(EVENT.SERVER_REMOVE_OBJECT, [relatedIds]);
            })
            .catch(() => {
                relatedIds.map(id => dataServices.update(id));
            })
    }

    onAddLink(link: dhtmlx.IDHMLXLink) {
        let configs = this._widgetConfigs;
        if (this._store.getObjectById(link.id)) return;
        dataServices.createEmptyObject(configs.link)
            .then(newObject => {
                this._subscriptions.subscribe(newObject.getGuid(), this.onChangeObject.bind(this));
                let attributes = {};
                attributes[configs.linkType] = dhtmlx.IDHMLXLinkType[link.type];
                let associations = {};
                associations[configs.linkProjectAssociation] = this._store.getContextId();
                associations[configs.linkSourceAssociation] = link.source;
                associations[configs.linkTargetAssociation] = link.target;
                return dataServices.modifyObject(newObject, attributes, associations);
            })
            .catch(e => {
                console.log(e);
                this._connect.publish(EVENT.SERVER_REMOVE_OBJECT, [link.id, this._widgetConfigs.link]);
            })
    }

    onDeleteLink(linkId: string) {
        let link = this._store.getObjectById(linkId);
        if (!link) return;
        dataServices.removeObject(linkId)
            .then(() => {
                this._connect.publish(EVENT.SERVER_REMOVE_OBJECT, [[linkId]]);
            })
            .catch(() => {
                dataServices.update(linkId);
            })
    }

    onEditLink(linkId: string) {
        let object = this._store.getObjectById(linkId);
        if (!object) return;
        this._widgetConfigs.linkEditForm && dataServices.openForm(this._widgetConfigs.linkEditForm, object);
    }

    onCallMicroflow(id: string, microflowName: string) {
        dataServices.callMicroflow(microflowName, [id])
    }

}