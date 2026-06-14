import { Authenticator } from "./auth.js";
import { FetchClient } from "./request.js";
import { MemoryStore } from "./store.js";
const default_store = new MemoryStore();
const default_client = new FetchClient();
const default_fetch_fn = globalThis.fetch;
const options = {
    store: default_store,
    client: default_client,
    auth: new Authenticator({
        client: default_client,
        store: default_store,
    }),
    language: "en",
    location: "US",
    debug: false,
    visitor_id: null,
    fetch: default_fetch_fn,
};
export function get_options() {
    return Object.freeze({ ...options });
}
export function get_option(name) {
    return get_options()[name];
}
export function set_options(passed_options) {
    Object.assign(options, passed_options);
}
export function set_option(name, value) {
    set_options({ [name]: value });
}
export function setup(passed_options = {}) {
    const options_without_auth = { ...passed_options };
    delete options_without_auth.auth;
    set_options(options_without_auth);
    if (passed_options.store) {
        const visitor_id = passed_options.store.get("visitor_id");
        if (visitor_id) {
            set_option("visitor_id", visitor_id);
        }
    }
    if (passed_options.auth || passed_options.client || passed_options.store) {
        if (passed_options.auth instanceof Authenticator) {
            options.auth = passed_options.auth;
        }
        else {
            options.auth = new Authenticator({
                client: options.client,
                store: options.store,
                ...(passed_options.auth ?? {}),
            });
        }
    }
}
