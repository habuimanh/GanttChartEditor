export function getDataByXPath(xPath: string): Promise<any> {
    return new Promise((resolve) => {
        mx.data.get({
            xpath: xPath,
            callback: (data) => {
                resolve(data)
            },
        })
    })
}

export function getLastCreatedObjects(entity: string, lastCreatedDate: number) {
    let xPath = `//${entity}[createdDate>${lastCreatedDate}]`
    return getDataByXPath(xPath);
}

export function getDataByGuid(guid: string): Promise<any> {
    return new Promise((resolve) => {
        mx.data.get({
            guid: guid,
            callback: (data) => {
                resolve(data)
            }
        })
    })
}

export function getDataByEntity(entityName: string): Promise<mendix.lib.MxObject[]> {
    if (!entityName) return new Promise(resolve => resolve([]));
    let xPath = `//${entityName}`
    return getDataByXPath(xPath)
}


/**
 * Load all objects of entity "destinationEntity" by association "association" to object with id "guid"
 * @param destinationEntity Name of entity to get
 * @param associations Name of association
 * @param guid guid of source object
 */
export function getDataByAssociations(destinationEntity: string, associations: string | string[], guid?: string): Promise<mendix.lib.MxObject[]> {
    if (!destinationEntity) return new Promise(resolve => resolve([]));
    associations = ([] as string[]).concat(associations);
    let associationXPath = associations.map(association => {
        if (!association) return "";
        return association + (guid ? `=${guid}` : "");
    }).filter(association => association !== "").join(" or ");
    if (!associationXPath) return new Promise(resolve => resolve([]));
    let xPath = `//${destinationEntity}[${associationXPath}]`
    return getDataByXPath(xPath)
}

export function getDataByAttributeOffline(destinationEntity: string, attribute: string, value: any): Promise<mendix.lib.MxObject[]> {
    return new Promise((resolve, reject) => {
        mx.data["getOffline"](destinationEntity, [{
            attribute: attribute,
            operator: "equals",
            value: value,
        }], {
                offset: 0,
                // limit: 5,
                // sort: [["Name", "asc"], ["Age", "desc"]]
            }, (objects: mendix.lib.MxObject[]) => {
                resolve(objects);
            }, (e) => {
                resolve([]);
                reject(e);
            })
    })
}

export function commit(object: mendix.lib.MxObject): Promise<Object> {
    return new Promise((resolve, reject) => {
        mx.data.commit({
            mxobj: object,
            callback: () => {
                resolve(object);
                // console.log("Successfully commit to server");
            },
            error: (e) => {
                reject(e);
            }
        })
    })

}

export function subscribeObject(guid: string, onChange: (guid: number) => any) {
    return mx.data.subscribe({
        guid: guid,
        callback: onChange,
    })
}

export function subscribeEntity(entity: string, onChange: (guid: number | string) => any) {
    return mx.data.subscribe({
        entity: entity,
        callback: onChange
    })
}

export function create(entity: string) {
    return new Promise<mendix.lib.MxObject>((resolve, reject) => {
        mx.data.create({
            entity: entity,
            callback: (object) => {
                resolve(object);
            },
            error: (e) => {
                reject(e);
                // console.log(e);
            }
        })
    })
}

export function remove(guid: string) {
    return new Promise<void>((resolve, reject) => {
        mx.data.remove({
            guid: guid,
            callback: () => {
                resolve();
            },
            error: (e) => {
                reject(e);
                console.log(e);
            }
        })
    })
}