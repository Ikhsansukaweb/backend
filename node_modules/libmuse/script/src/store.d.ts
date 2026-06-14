import "../_dnt.polyfills.js";
export declare abstract class Store {
    version: string;
    abstract get<T>(key: string): T | null;
    abstract set(key: string, value: unknown): void;
    abstract delete(key: string): void;
}
export declare class DenoFileStore extends Store {
    private path;
    map: Map<string, unknown>;
    constructor(path: string);
    get<T>(key: string): T | null;
    set(key: string, value: unknown): void;
    delete(key: string): void;
    private save;
}
export declare class MemoryStore extends Store {
    map: Map<string, unknown>;
    get<T>(key: string): T | null;
    set(key: string, value: unknown): void;
    delete(key: string): void;
}
export declare class LocalStorageStore extends Store {
    name: string;
    map: Map<string, unknown>;
    constructor(name?: string);
    get<T>(key: string): T | null;
    set(key: string, value: unknown): void;
    delete(key: string): void;
    private save;
}
export declare const get_best_store: () => Store;
/** @deprecated use `get_best_store` */
export declare const get_default_store: () => Store;
//# sourceMappingURL=store.d.ts.map