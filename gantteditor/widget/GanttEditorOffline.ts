/// <reference path="../../typings/index.d.ts" />
import declare = require("dojo/_base/declare");
import _WidgetBase = require("mxui/widget/_WidgetBase");
import _TemplatedMixin = require("dijit/_TemplatedMixin");
import { GanttEditor } from "./GanttEditor";


let widgetInstance = new GanttEditor(true);
export = declare("gantteditor.widget.GanttEditorOffline", [_WidgetBase, _TemplatedMixin], widgetInstance);