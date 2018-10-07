export function generateTemplate(templateString: string, variableMapping: Map<string, string>): (object) => string {
    return (object) => {
        if (object['unscheduled']) return "";
        return templateString.replace(/\${(.*?)}/g, ((variable: string) => {
            variable = variable.slice(2, variable.length - 1);
            let attributeName = variableMapping.get(variable);
            return attributeName ? `${object[attributeName]}` : "";
        }))
    }
}

export function generateSingleVariableTemplate(templateString: string, attributeName: string) {
    let variableMapping = new Map();
    variableMapping.set("", attributeName);
    return generateTemplate(templateString, variableMapping);
}