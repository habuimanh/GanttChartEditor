import dhtmlx = require("../interfaces/dhtmlxInterface")

export interface IGridCollumn {
    name: string,
    label?: string,
    align?: string,
    tree?: boolean,
    width?: string | number,
    resize?: boolean,
    open?: boolean,
    min_width?: number,
    template?: ((task: dhtmlx.IDHMLXTask) => string),
}