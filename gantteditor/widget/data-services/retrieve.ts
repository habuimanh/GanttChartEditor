import mendixApi = require("../utils/mxWidgetUtils");
import { WidgetConfigs, GanttChartData } from "../interfaces/index"

export function retrieveDataFromContext(context: mendix.lib.MxObject, widgetProps: WidgetConfigs): Promise<GanttChartData> {
    return new Promise((resolve, reject) => {
        let progressId = mx.ui.showProgress();
        return Promise.all([
            mendixApi.getDataByAssociations(widgetProps.task, widgetProps.taskProjectAssociation, context.getGuid()),
            mendixApi.getDataByAssociations(widgetProps.link, widgetProps.linkProjectAssociation, context.getGuid())
        ])
            .then((objects: mendix.lib.MxObject[][]) => {
                mx.ui.hideProgress(progressId);
                resolve(new GanttChartData(context, objects[0], objects[1]));
            })
            .catch(e => {
                mx.ui.hideProgress(progressId);
                reject(e);
            });
    })
}

export function retrieveObjectById(guid: string): Promise<mendix.lib.MxObject> {
    return mendixApi.getDataByGuid(guid);
}

export function retrieveDataOffline(context: mendix.lib.MxObject, widgetProps: WidgetConfigs): Promise<GanttChartData> {
    return new Promise((resolve, reject) => {
        let progressId = mx.ui.showProgress();
        return Promise.all([
            mendixApi.getDataByAttributeOffline(widgetProps.task, widgetProps.taskProjectAssociation, context.getGuid()),
            mendixApi.getDataByAttributeOffline(widgetProps.link, widgetProps.linkProjectAssociation, context.getGuid())
        ])
            .then((objects: mendix.lib.MxObject[][]) => {
                mx.ui.hideProgress(progressId);
                resolve(new GanttChartData(context, objects[0], objects[1]));
            })
            .catch(e => {
                mx.ui.hideProgress(progressId);
                reject(e);
            });

    })
}