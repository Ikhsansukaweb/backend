"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_options = get_options;
exports.get_option = get_option;
exports.set_options = set_options;
exports.set_option = set_option;
exports.setup = setup;
const auth_js_1 = require("./auth.js");
const request_js_1 = require("./request.js");
const store_js_1 = require("./store.js");
const default_store = new store_js_1.MemoryStore();
const default_client = new request_js_1.FetchClient();
const default_fetch_fn = globalThis.fetch;
const options = {
    store: default_store,
    client: default_client,
    auth: new auth_js_1.Authenticator({
        client: default_client,
        store: default_store,
    }),
    language: "en",
    location: "US",
    debug: false,
    visitor_id: null,
    fetch: default_fetch_fn,
};
function get_options() {
    return Object.freeze({ ...options });
}
function get_option(name) {
    return get_options()[name];
}
function set_options(passed_options) {
    Object.assign(options, passed_options);
}
function set_option(name, value) {
    set_options({ [name]: value });
}
function setup(passed_options = {}) {
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
        if (passed_options.auth instanceof auth_js_1.Authenticator) {
            options.auth = passed_options.auth;
        }
        else {
            options.auth = new auth_js_1.Authenticator({
                client: options.client,
                store: options.store,
                ...(passed_options.auth ?? {}),
            });
        }
    }
}
