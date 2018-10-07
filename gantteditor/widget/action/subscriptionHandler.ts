// import {WidgetConnect} from "../connect/widgetConnect"
import dataServices = require("../data-services/index")

export class SubscriptionHandler {
    private _guidHandlerDict: Map<string, any>;

    constructor() {
        this._guidHandlerDict = new Map();
    }

    subscribe(guid: string, callback) {
        if (!this._guidHandlerDict.has(guid)) {
            this._guidHandlerDict.set(guid, dataServices.subscribe(guid, callback));
        }
        
    }
}