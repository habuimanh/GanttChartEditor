/// <reference path="../../typings/index.d.ts" />
import GanttEditorInput from "./GanttEditorInput";
import widgetTemplate = require("dojo/text!gantteditor/widget/template/GanttEditor.html");
import { WidgetConnect } from "./connect/widgetConnect";
import { Store, DHTMLXStore } from "./stores/index";
import { Action } from "./action/action";
import { EVENT } from "./events/index";
import ViewConfigs from "./view/ViewConfig";

export class GanttEditor extends GanttEditorInput {
    public domNode: HTMLDivElement;
    public contextMenu: HTMLElement;
    public ganttContainer: HTMLElement;
    public toolbar: HTMLElement;
    public templateString: string = widgetTemplate;

    private _store: Store;
    private _action: Action;
    private _dhtmlxStore: DHTMLXStore;
    private _connect: WidgetConnect;
    private _widgetId: string;
    private _viewConfig: ViewConfigs;

    constructor(private _offline: boolean) {
        super();
        this.constructor = () => { };
    }

    postCreate() {
        this.setupMetaData();
        this._widgetId = Date.now().toString();
        this._connect = new WidgetConnect(this._widgetId);
        this._store = new Store(this._widgetConfig, this._connect);
        this._dhtmlxStore = new DHTMLXStore(this._widgetConfig, this._connect);
        this._action = new Action(this._store, this._connect, this._offline);
        this._viewConfig = new ViewConfigs(this._widgetConfig, this._connect, this.domNode, this.ganttContainer, this.toolbar);
    }

    update(context?: mendix.lib.MxObject, callback?: () => void) {
        if (context) {
            this._connect.publish(EVENT.SERVER_UPDATE_CONTEXT_OBJECT, [context]);
        }
        callback && callback();
    }

    uninitialize() {
        this._connect.publish(EVENT.DESTROY);
    }
}

