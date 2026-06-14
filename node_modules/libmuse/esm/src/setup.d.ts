import { Authenticator, PureAuthenticatorOptions } from "./auth.js";
import { RequestFunction } from "./request.js";
import { RequestClient } from "./request.js";
import { Store } from "./store.js";
export interface Options {
    auth: Authenticator;
    client: RequestClient;
    store: Store;
    language: string;
    location: string;
    debug: boolean;
    visitor_id: string | null;
    fetch: RequestFunction;
}
export declare function get_options(): Readonly<{
    auth: Authenticator;
    client: RequestClient;
    store: Store;
    language: string;
    location: string;
    debug: boolean;
    visitor_id: string | null;
    fetch: RequestFunction;
}>;
export declare function get_option<Name extends keyof Options>(name: Name): Readonly<{
    auth: Authenticator;
    client: RequestClient;
    store: Store;
    language: string;
    location: string;
    debug: boolean;
    visitor_id: string | null;
    fetch: RequestFunction;
}>[Name];
export declare function set_options(passed_options: Partial<Options>): void;
export declare function set_option<Name extends keyof Options>(name: Name, value: Options[Name]): void;
export interface SetupOptions extends Omit<Options, "auth"> {
    auth: PureAuthenticatorOptions;
}
export declare function setup(passed_options?: Partial<SetupOptions>): void;
//# sourceMappingURL=setup.d.ts.map