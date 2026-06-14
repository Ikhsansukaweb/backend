import "../_dnt.polyfills.js";
export class Store {
    constructor() {
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "muse-1"
        });
        // set(key: string, value: unknown): void {
        //   this._set(key, value);
        // }
        // get<T>(key: string): T | null {
        //   const value = this._get(key);
        //   if (value == null) return null;
        //   return JSON.parse(value) as T;
        // }
    }
}
export class DenoFileStore extends Store {
    constructor(path) {
        super();
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: path
        });
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Load the file if it exists
        try {
            // dnt-shim-ignore
            const content = Deno.readTextFileSync(path);
            const json = JSON.parse(content);
            if (json.version !== this.version) {
                throw "";
            }
            else {
                this.map = new Map(Object.entries(json));
            }
        }
        catch (_error) {
            this.map = new Map();
            this.set("version", this.version);
        }
    }
    get(key) {
        return this.map.get(key) ?? null;
    }
    set(key, value) {
        this.map.set(key, value);
        this.save();
    }
    delete(key) {
        this.map.delete(key);
        this.save();
    }
    save() {
        const json = JSON.stringify(Object.fromEntries(this.map), null, 2);
        // dnt-shim-ignore
        Deno.writeTextFileSync(this.path, json);
    }
}
export class MemoryStore extends Store {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map([["version", this.version]])
        });
    }
    get(key) {
        return this.map.get(key) ?? null;
    }
    set(key, value) {
        this.map.set(key, value);
    }
    delete(key) {
        this.map.delete(key);
    }
}
export class LocalStorageStore extends Store {
    constructor(name = "muse-store") {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        const data = localStorage.getItem(this.name);
        let json = null;
        try {
            json = JSON.parse(data ?? "");
        }
        catch (_error) {
            // Ignore
        }
        if (json && json.version === this.version) {
            this.map = new Map(Object.entries(json));
        }
        else {
            this.map = new Map();
            this.set("version", this.version);
        }
    }
    get(key) {
        return this.map.get(key) ?? null;
    }
    set(key, value) {
        this.map.set(key, value);
        this.save();
    }
    delete(key) {
        this.map.delete(key);
        this.save();
    }
    save() {
        const json = JSON.stringify(Object.fromEntries(this.map), null, 2);
        localStorage.setItem(this.name, json);
    }
}
export const get_best_store = () => {
    // dnt-shim-ignore
    if ("Deno" in globalThis) {
        return new DenoFileStore("muse-store.json");
        // dnt-shim-ignore
    }
    else if ("localStorage" in globalThis) {
        return new LocalStorageStore();
    }
    else {
        return new MemoryStore();
    }
};
/** @deprecated use `get_best_store` */
export const get_default_store = get_best_store;
