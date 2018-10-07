export class OrderedSet {
    constructor(private _list: string[] = [],
        private _set: Set<string> = new Set(),
        private _compare: (id1: string, id2: string) => number = () => 1
    ) { }
    has(id: string): boolean {
        return this._set.has(id);
    }
    insert(id: string, order?: number) {
        if (this._list.length === 0) {
            this._list.push(id);
            this._set.add(id);
            return;
        }
        if (this._set.has(id)) return;
        this._set.add(id);
        if (!order) {
            let currentPos = this._list.length - 1;
            while (currentPos >= 0 && this._compare(this._list[currentPos], id) === 1) {
                this._list[currentPos + 1] = this._list[currentPos];
                currentPos--;
            }
            this._list[currentPos + 1] = id;
        } else {
            let currentPos = this._list.length - 1;
            while (currentPos >= 0 && currentPos !== order) {
                this._list[currentPos + 1] = this._list[currentPos];
                currentPos--;
            }
            this._list[currentPos + 1] = id;
        }
    }

    remove(removeId: string) {
        this._list = this._list.filter(id => id !== removeId);
        this._set.delete(removeId);
    }

    get list() {
        return this._list;
    }
}

export function compareObjectByAttribute(attributeName: string) {
    return (object1: mendix.lib.MxObject, object2: mendix.lib.MxObject) => {
        let attr1 = object1.get(attributeName)
        let attr2 = object2.get(attributeName)
        if (attr1 > attr2) return 1;
        if (attr1 === attr2) return 0;
        return -1;
    }
}