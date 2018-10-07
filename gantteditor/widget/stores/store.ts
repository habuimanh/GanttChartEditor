import { WidgetConfigs, GanttChartData } from "../interfaces/index";
import { WidgetConnect } from "../connect/widgetConnect";
import { EVENT } from "../events/index";
import { OrderedSet } from "../utils/OrderedSet"
import dhtmlx = require("../interfaces/dhtmlxInterface");
// import mapping = require("./dhtmlxStoreMapping");
export interface ICloneObject {
    guid: string,
    associations: Map<string, string[]>;
}

export class Store {
    private _data: GanttChartData;
    private _eventHandlers: any[];
    private _idToObjectDict: Map<string, mendix.lib.MxObject>;
    // store associations of all objects in form: targetId => associations => sourceId
    private _associations: Map<string | number, Map<string, OrderedSet>>;
    // specify which association is reference set
    private _referenceSetAssociations: Set<string>;
    // store associations of object before updated from server (just for removing)
    private _cloneObjects: Map<string | number, ICloneObject>;

    constructor(
        private _widgetConfigs: WidgetConfigs,
        private _connect: WidgetConnect
    ) {
        this._idToObjectDict = new Map();
        this._associations = new Map();
        this._referenceSetAssociations = new Set();
        this._cloneObjects = new Map();
        this.setupEvents();
    }

    private setupEvents() {
        this._eventHandlers = this._connect.subscribeEvents([
            { topic: EVENT.SERVER_UPDATE_DATA, context: this, method: this.updateData },
            { topic: EVENT.SERVER_UPDATE_OBJECT, context: this, method: this.updateObject },
            { topic: EVENT.SERVER_REMOVE_OBJECT, context: this, method: this.onRemoveObjectOnServer },
        ]);
    }

    setReferenceSetAssociations() {
        [
            ""
        ].forEach(association => association && this._referenceSetAssociations.add(association));
    }

    private getSortOrder(task: mendix.lib.MxObject): number {
        if (task && task.get(this._widgetConfigs.taskSortOrder)) {
            return parseFloat(task.get(this._widgetConfigs.taskSortOrder)["toPrecision"]());
        }
        return 1;
    }

    private compareObjectBySortOrder(taskId1: string, taskId2: string): number {
        let task1 = this.getObjectById(taskId1);
        let task2 = this.getObjectById(taskId2);
        if (!task1 || !task2) return 1;
        let order1 = this.getSortOrder(task1);
        let order2 = this.getSortOrder(task2);
        if (order1 > order2) return 1;
        if (order1 === order2) return 0;
        return -1;
    }

    addAssociation(sourceGuid: string, desGuid: string, association: string) {
        if (!this._associations.has(sourceGuid)) {
            this._associations.set(sourceGuid, new Map());
        }
        if (!this._associations.get(sourceGuid)!.has(association)) {
            this._associations.get(sourceGuid)!.set(association, new OrderedSet([], undefined, this.compareObjectBySortOrder.bind(this)));
        }
        this._associations.get(sourceGuid)!.get(association)!.insert(desGuid);
    }

    addAllAssociationsOfObject(object: mendix.lib.MxObject) {
        let sourceGuid = object.getGuid();
        let associations: string[] = object["getReferenceAttributes"]();
        associations.forEach(association => {
            let targetGuids = object["getOriginalValue"](association);
            if (targetGuids && !(targetGuids instanceof Array)) targetGuids = [targetGuids];
            targetGuids && targetGuids.forEach(targetGuid => {
                this.addAssociation(targetGuid.toString(), sourceGuid, association);
                if (this._referenceSetAssociations.has(association)) {
                    this.addAssociation(sourceGuid, targetGuid.toString(), association);
                }
            })
        })
    }

    removeAssociation(sourceGuid: string | number, desGuid: string, association: string) {
        if (!this._associations.has(sourceGuid)) {
            return;
        }
        if (!this._associations.get(sourceGuid)!.has(association)) {
            return;
        }
        this._associations.get(sourceGuid)!.get(association)!.remove(desGuid);
    }

    removeAllAssociationsOfObject(object: ICloneObject) {
        let associations = object.associations;
        associations.forEach((targetGuids, association) => {
            if (targetGuids && !(targetGuids instanceof Array)) targetGuids = [targetGuids];
            targetGuids && targetGuids.forEach(targetGuid => {
                this.removeAssociation(targetGuid, object.guid, association);
                if (this._referenceSetAssociations.has(association)) {
                    this.removeAssociation(object.guid, targetGuid.toString(), association);
                }
            })
        })
    }

    addClone(object: mendix.lib.MxObject) {
        let associations = new Map();
        let references: string[] = object["getReferenceAttributes"]();
        references.forEach(reference => associations.set(reference, object["getOriginalValue"](reference)));
        this._cloneObjects.set(object.getGuid(), {
            guid: object.getGuid(),
            associations: associations,
        })
    }

    addObject(object?: mendix.lib.MxObject) {
        if (!object) return;
        this.addClone(object);
        this._idToObjectDict.set(object.getGuid(), object);
        this.addAllAssociationsOfObject(object);
    }

    onRemoveObjectOnServer(ids: string[] | string, entity?: string) {
        if (ids instanceof Array) {
            ids.forEach(id => {
                let object = this.getObjectById(id);
                if (!object) return;
                this.removeObject(object);

                // publish removing event
                switch (object.getEntity()) {
                    case this._widgetConfigs.task:
                        this._connect.publish(EVENT.STORE_DELETE_TASK, [id]);
                    case this._widgetConfigs.link:
                        this._connect.publish(EVENT.STORE_DELETE_LINK, [id]);
                }
            });
        } else {
            switch (entity) {
                case this._widgetConfigs.task:
                    this._connect.publish(EVENT.STORE_DELETE_TASK, [ids]);
                case this._widgetConfigs.link:
                    this._connect.publish(EVENT.STORE_DELETE_LINK, [ids]);
            }
        }

    }

    removeObject(object?: mendix.lib.MxObject | string) {
        if (!object) return
        if (typeof object === "string") {
            object = this._idToObjectDict.get(object);
        }
        let mxObject = object as mendix.lib.MxObject;
        this._idToObjectDict.delete(mxObject.getGuid());
        let cloneObject = this._cloneObjects.get(mxObject.getGuid());
        if (!cloneObject) return;
        this.removeAllAssociationsOfObject(cloneObject);
        this._cloneObjects.delete(mxObject.getGuid());
    }

    updateObject(newObjects?: mendix.lib.MxObject | mendix.lib.MxObject[], notPublish?: boolean) {
        if (!newObjects) return;
        if (!(newObjects instanceof Array)) {
            newObjects = [newObjects];
        }
        newObjects.forEach(newObject => {
            let guid = newObject.getGuid();
            let oldObject = this._idToObjectDict.get(guid);
            let type: "add" | "update" = "add";
            if (oldObject) {
                type = "update";
                this.removeObject(oldObject);
            }
            this.addObject(newObject);
            !notPublish && this.publishUpdateEvent(newObject, type);
        })

    }

    getTaskDependencies(taskId: string): string[] {
        let dependencyIds: string[] = [];
        if (!this._associations.has(taskId)) return [];
        let association = this._associations.get(taskId)!;
        if (association.has(this._widgetConfigs.linkSourceAssociation)) {
            dependencyIds = dependencyIds.concat(association.get(this._widgetConfigs.linkSourceAssociation)!.list);
        }
        if (association.has(this._widgetConfigs.linkTargetAssociation)) {
            dependencyIds = dependencyIds.concat(association.get(this._widgetConfigs.linkTargetAssociation)!.list);
        }
        return dependencyIds;
    }

    private updateData(data: GanttChartData) {
        this._data = data;
        [
            ...this._data.links,
            ...this._data.tasks
        ].map(object => this.updateObject(object, true));

        this._connect.publish(EVENT.STORE_UPDATE_DATA, [data]);
    }

    private publishUpdateEvent(newObject: mendix.lib.MxObject, type: "add" | "update") {

        if (type === "update") {
            switch (newObject.getEntity()) {
                case this._widgetConfigs.link:
                    this._connect.publish(EVENT.STORE_UPDATE_LINK, [newObject]);
                    break;
                case this._widgetConfigs.task:
                    this._connect.publish(EVENT.STORE_UPDATE_TASK, [newObject, this.getIndexByTaskId(newObject.getGuid())]);
                    break;
            }
        } else {
            switch (newObject.getEntity()) {
                case this._widgetConfigs.link:
                    this._connect.publish(EVENT.STORE_UPDATE_LINK, [newObject]);
                    break;
                case this._widgetConfigs.task:
                    this._connect.publish(EVENT.STORE_ADD_TASK, [newObject, this.getIndexByTaskId(newObject.getGuid())]);
                    break;
            }
        }
    }

    getWidgetConfigs() {
        return this._widgetConfigs;
    }

    getObjectById(id: string) {
        return this._idToObjectDict.get(id);
    }

    getContextId() {
        return this._data.project.getGuid();
    }

    getChildrenSet(parentTaskId?: string): string[] {
        if (!parentTaskId) {
            // parent task is project
            parentTaskId = this.getContextId();
            if (!this._associations.has(parentTaskId)
                || !this._associations.get(parentTaskId)!.has(this._widgetConfigs.taskProjectAssociation)) return [];
            // get all tasks in project
            return this._associations.get(parentTaskId)!.get(this._widgetConfigs.taskProjectAssociation)!.list
                // then select task which no parent
                .filter(id => {
                    let task = this.getObjectById(id);
                    if (!task) return false;
                    return !task.get(this._widgetConfigs.taskParentAssociation);
                });
        }

        // parent task is normal task
        if (!this._associations.has(parentTaskId)
            || !this._associations.get(parentTaskId)!.has(this._widgetConfigs.taskParentAssociation)) return [];
        return this._associations.get(parentTaskId)!.get(this._widgetConfigs.taskParentAssociation)!.list;
    }

    calculateNewOrderOfChildTask(parentTaskId: string): number {
        // By default, order of task will be order of parent task's last child + 0.001
        let childrenSet = this.getChildrenSet(parentTaskId);
        if (!childrenSet || childrenSet.length === 0) return 0;

        let lastChildId = childrenSet[childrenSet.length - 1];
        let lastChild = this._idToObjectDict.get(lastChildId);
        if (!lastChild) return 0;

        return this.getSortOrder(lastChild) + 0.001;
    }
    getIndexByTaskId(id: string): number {
        let object = this.getObjectById(id);
        if (!object) return 0;

        let parentId = object.get(this._widgetConfigs.taskParentAssociation) as string;
        const taskSameParents = this.getChildrenSet(parentId);
        return taskSameParents.findIndex(taskId => taskId === id);
    }
    calculateDefaultStartDate(parentTaskId: string): number {
        // parent is normal task
        if (parentTaskId) {
            let parent = this.getObjectById(parentTaskId);
            if (!parent) return Date.now();
            // default start date will be start date of parent task
            return parseInt(parent.get(this._widgetConfigs.taskStartDate) as string);
        }

        //parent is project
        let childrenSet = this.getChildrenSet(parentTaskId);
        if (!childrenSet || childrenSet.length === 0) return Date.now();

        let lastChildId = childrenSet[childrenSet.length - 1];
        let lastChild = this._idToObjectDict.get(lastChildId);
        if (!lastChild) return Date.now();
        // default start date will be start date of parent task's last child
        return parseInt(lastChild.get(this._widgetConfigs.taskStartDate) as string);
    }
    findNewSortOrderOfTaskDrag(taskDrag: dhtmlx.IDHMLXTask, taskTarget: dhtmlx.IDHMLXTask) {
        const parentId = this.getObjectById(taskTarget.id)!.get(this._widgetConfigs.taskParentAssociation) as string;
        const idTaskSameTargetParents = this.getChildrenSet(parentId);
        // const taskSameTargetParents = this.getTaskSameParents(taskTarget.parent!.toString());
        /*--------Find task beside task target--------*/
        let indexTaskBesideTarget = -1;
        idTaskSameTargetParents.forEach((taskId, i) => {
            if (taskId === taskTarget.id) {
                //If drag on to top or bottom of list. 
                if ((i === 0 && taskDrag.$index < taskTarget.$index) || (i === idTaskSameTargetParents.length - 1 && taskDrag.$index > taskTarget.$index)) indexTaskBesideTarget = i;
                //If drag to under drop target.
                else if (taskDrag.$index > taskTarget.$index) indexTaskBesideTarget = i + 1;
                //If drag to above drop target.
                else indexTaskBesideTarget = i - 1;
            }
        });
        const taskBesideTarget = idTaskSameTargetParents[indexTaskBesideTarget];
        /*--------Find new sort order of task drag by task target and task beside target--------*/
        let newSortOrder = -1;
        //If drag to top of list tasks.
        if (indexTaskBesideTarget === 0 && idTaskSameTargetParents[indexTaskBesideTarget] === taskTarget.id && taskDrag.$index < taskTarget.$index) {
            newSortOrder = this.getSortOrder(this.getObjectById(taskBesideTarget)!) - 1;
        }
        //If drag to bottom of list tasks.
        else if ((indexTaskBesideTarget === idTaskSameTargetParents.length - 1) && taskDrag.$index > taskTarget.$index && idTaskSameTargetParents[indexTaskBesideTarget] === taskTarget.id) {
            newSortOrder = this.getSortOrder(this.getObjectById(taskBesideTarget)!) + 1;
        }
        //If drag into middle of 2 tasks.
        else newSortOrder = (this.getSortOrder(this.getObjectById(taskBesideTarget)!) + taskTarget.sortOrder) / 2;
        return Number(newSortOrder).toFixed(8);
    }

}