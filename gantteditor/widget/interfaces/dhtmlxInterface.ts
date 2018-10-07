interface Map {
    [id: string]: any;
}
export interface IDHMLXTask extends Map {
    id: string;
    name: string;
    duration: number;
    progress: number;
    start_date: Date;
    end_date?: Date;
    parent?: number | string;
    sortOrder: number;
    unscheduled?: boolean;
    text: string;
    color?: string;
}

export interface IDHMLXLink {
    id: string;
    source: number;
    target: number;
    color?: string;
    type: IDHMLXLinkType;
}

export enum IDHMLXLinkType {
    Finish_Start,
    Start_Start,
    Finish_Finish,
    Start_Finish
}

export interface IDHTMLXData {
    data: IDHMLXTask[],
    links: Array<any>,
}

