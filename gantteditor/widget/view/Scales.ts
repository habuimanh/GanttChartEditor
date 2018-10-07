export function selectDayScale() {
    gantt.config.scale_unit = "day";
    gantt.config.step = 1;
    gantt.config.date_scale = "%d %M";
    gantt.config.scale_height = 50;
    gantt.config.subscales = [];
}

export function selectMonthScale() {
    gantt.config.scale_unit = "month";
    gantt.config.step = 1;
    gantt.config.date_scale = "%F, %Y";
    gantt.config.scale_height = 50;
    gantt.config.subscales = [
        {unit: "day", step: 1, date: "%j, %D"}
    ]
}

export function selectHourScale() {
    gantt.config.scale_unit = "day";
    gantt.config.step = 1;
    gantt.config.date_scale = "%F %d";
    gantt.config.scale_height = 50;
    gantt.config.subscales = [
		{unit: "hour", step: 2, date: "%H:%i"}
    ];
}

export function setScale(type: string) {
    switch (type) {
        case ScaleType.DAY: selectDayScale(); break;
        case ScaleType.MONTH: selectMonthScale(); break;
        case ScaleType.HOUR: selectHourScale(); break;
    }
    gantt.render();
}

export enum ScaleType {
    DAY = "day",
    MONTH = "month",
    HOUR = "hour",
}