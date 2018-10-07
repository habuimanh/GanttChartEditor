import connect = require("dojo/_base/connect");

export class WidgetConnect {

    private _registeredHandles: any[];

    constructor(private _widgetId: string) {
        this._registeredHandles = [];
    }

    private _addWidgetIdToTopic(topic: string): string {
        return this._widgetId + topic;
    }

    publish(topic: string, data: any[] = []) {
        connect.publish(this._addWidgetIdToTopic(topic), data);
    }

    subscribe(topic: string, context?: Object, method?: Function) {
        let handle: any = null;
        let widgetTopic = this._addWidgetIdToTopic(topic);

        handle = connect.subscribe(widgetTopic, context, method);
        if (handle != null) {
            this._registeredHandles.push(handle);
        }

        return handle;
    }

    subscribeEvents(events: {
        topic: string,
        context?: Object,
        method?: Function,
    }[]) {
        return events.map(event => this.subscribe(event.topic, event.context, event.method));
    }
}