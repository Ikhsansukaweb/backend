"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchClient = exports.RequestClient = void 0;
require("../_dnt.polyfills.js");
const errors_js_1 = require("./errors.js");
const locales_js_1 = __importDefault(require("../locales/locales.js"));
const setup_js_1 = require("./setup.js");
const util_js_1 = require("./util.js");
class RequestClient {
    constructor() {
        Object.defineProperty(this, "auth_header", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    // request but return json
    async request_json(url, options) {
        const response = await this.request(url, options);
        const json = await response.json();
        return json;
    }
}
exports.RequestClient = RequestClient;
class FetchClient extends RequestClient {
    constructor() {
        super();
    }
    do_fetch(url, options) {
        return (0, setup_js_1.get_option)("fetch")(url, {
            method: options.method,
            headers: options.headers,
            body: options.body,
            signal: options.signal,
        });
    }
    async request(path, options) {
        (0, util_js_1.debug)(options.method, path);
        const url = new URL(path);
        (new URLSearchParams(options.params)).forEach((value, key) => {
            url.searchParams.set(key, value);
        });
        const headers = new Headers(options.headers);
        const config = {};
        const lang = (0, setup_js_1.get_option)("language");
        const location = (0, setup_js_1.get_option)("location");
        // headers.set("X-Goog-Visitor-Id", get_option("visitor_id"));
        if (lang) {
            if (locales_js_1.default.languages.findIndex((e) => e.value === lang) < 0) {
                throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.UNSUPPORTED_LANGUAGE, `Unsupported locale: ${lang}`);
            }
            let lang_string = lang;
            if (lang.includes("-"))
                lang_string += "," + lang.split("-")[0];
            lang_string += ";q=0.5";
            headers.set("Accept-Language", lang_string);
            config.hl = lang;
        }
        if (location) {
            if (locales_js_1.default.locations.findIndex((e) => e.value === location) < 0) {
                throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.UNSUPPORTED_LOCATION, `Unsupported location: ${location}`);
            }
            config.gl = location;
        }
        const hasData = options.data != null;
        const visitor_id = (0, setup_js_1.get_option)("visitor_id");
        if (visitor_id)
            headers.set("X-Goog-Visitor-Id", visitor_id);
        if (!options.raw_data && hasData && !(options.data instanceof Uint8Array)) {
            if (Object.keys(config).length > 0) {
                setNestedValue(options.data, "context.client", {
                    ...options.data.context?.client,
                    ...config,
                });
            }
            if (visitor_id) {
                setNestedValue(options.data, "context.client.visitorData", visitor_id);
            }
        }
        // if (this.auth_header) headers.set("Authorization", this.auth_header);
        // debug(`Requesting ${options.method} with ${JSON.stringify(options)}`);
        const response = await this.do_fetch(url.toString(), {
            method: options.method,
            headers,
            body: hasData
                ? (options.raw_data || options.data instanceof Uint8Array)
                    ? options.data
                    : JSON.stringify(options.data)
                : undefined,
            signal: options.signal,
        });
        (0, util_js_1.debug)("DONE", options.method, path);
        // if (!response.ok) {
        //   const text = await response.text();
        //   throw new Error(text);
        // }
        return response;
    }
}
exports.FetchClient = FetchClient;
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let currentObj = obj;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!Object.hasOwn(currentObj, key)) {
            currentObj[key] = {};
        }
        if (i === keys.length - 1) {
            currentObj[key] = value;
        }
        else {
            currentObj = currentObj[key];
        }
    }
    return obj;
}
