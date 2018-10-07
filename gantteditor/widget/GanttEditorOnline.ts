import declare = require("dojo/_base/declare");
import _WidgetBase = require("mxui/widget/_WidgetBase");
import _TemplatedMixin = require("dijit/_TemplatedMixin");
import { GanttEditor } from "./GanttEditor";

let widgetInstance = new GanttEditor(false);
export = declare("gantteditor.widget.GanttEditorOnline", [_WidgetBase, _TemplatedMixin], widgetInstance);