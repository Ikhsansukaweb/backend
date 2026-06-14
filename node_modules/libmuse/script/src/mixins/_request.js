"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_auth_headers = get_auth_headers;
exports.request = request;
exports.request_json = request_json;
const constants_ng_js_1 = __importDefault(require("../constants-ng.js"));
const setup_js_1 = require("../setup.js");
const util_js_1 = require("../util.js");
const errors_js_1 = require("../errors.js");
const nav_js_1 = require("../nav.js");
function get_auth_headers() {
    return (0, setup_js_1.get_option)("auth").get_headers();
}
async function load_visitor_id(signal) {
    if (!(0, setup_js_1.get_option)("auth").has_token() && !(0, setup_js_1.get_option)("visitor_id")) {
        const visitor_id = await (0, setup_js_1.get_option)("client").request(`${constants_ng_js_1.default.API_URL}/browse`, {
            method: "post",
            data: {
                ...constants_ng_js_1.default.DATA,
            },
            signal,
        }).then((result) => result.json())
            .then((json) => json.responseContext.visitorData);
        (0, setup_js_1.get_option)("store").set("visitor_id", visitor_id);
        (0, setup_js_1.set_option)("visitor_id", visitor_id);
    }
}
async function request(endpoint, options) {
    const auth_headers = await get_auth_headers();
    await load_visitor_id(options.signal);
    const url = endpoint.startsWith("http")
        ? endpoint
        : `${constants_ng_js_1.default.API_URL}/${endpoint}`;
    const response = await (0, setup_js_1.get_option)("client").request(url, {
        method: options.method || "post",
        data: options.method === "get" ? undefined : {
            ...constants_ng_js_1.default.DATA,
            ...options.data,
        },
        headers: {
            ...constants_ng_js_1.default.HEADERS,
            ...auth_headers,
            "Content-Type": "application/json",
            "X-Goog-Request-Time": (new Date()).getTime().toString(),
            ...options.headers,
        },
        params: {
            ...options.params,
            prettyPrint: "false",
        },
        signal: options.signal,
    });
    if (!response.ok) {
        switch (response.status) {
            case 401:
                throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.AUTH_REQUIRED, "Authentication required", { cause: await response.json() });
            case 404:
                throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.NOT_FOUND, "Not found", {
                    cause: await response.json(),
                });
            default:
                throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.GENERIC, "Can't fetch data", {
                    cause: await response.text(),
                });
        }
    }
    return response;
}
async function request_json(endpoint, options) {
    const response = await request(endpoint, options);
    const json = await response.json();
    // checking if YouTube Music isn't available in the country
    const icon = (0, util_js_1.jo)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, nav_js_1.ITEM_SECTION, "messageRenderer.icon.iconType");
    if (icon === "MUSIC_UNAVAILABLE") {
        throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.NOT_AVAILABLE, "YouTube Music isn't available in your country");
    }
    return json;
}
