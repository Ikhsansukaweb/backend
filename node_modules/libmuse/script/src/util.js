"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.j = exports.jo = exports.jom = exports.debug = exports.wait = void 0;
exports.sum_total_duration = sum_total_duration;
const deps_js_1 = require("./deps.js");
const errors_js_1 = require("./errors.js");
const setup_js_1 = require("./setup.js");
/**
 * Wait a given number of milliseconds, then resolve
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.wait = wait;
/**
 * Logs debug messages to the console
 */
const debug = (...args) => {
    if ((0, setup_js_1.get_option)("debug"))
        console.debug(...args);
};
exports.debug = debug;
const jom = (json, path, resultType) => {
    const result = (0, deps_js_1.JSONPath)({ path, json: json, resultType });
    return result.length ? result : null;
};
exports.jom = jom;
const jo = (json, path, ...others) => {
    const result = (0, deps_js_1.JSONPath)({
        path: [path, ...others].join("."),
        json: json,
    });
    return result.length ? result[0] : null;
};
exports.jo = jo;
const j = (json, path, ...others) => {
    const result = (0, exports.jo)(json, path, ...others);
    if (result == null) {
        throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.PARSING_INVALID_JSON, `JSONPath expression "${[path, ...others]}" returned nothing`);
    }
    return result;
};
exports.j = j;
function sum_total_duration(item) {
    if (!("tracks" in item)) {
        return 0;
    }
    else {
        return item.tracks.reduce((acc, track) => acc + track.duration_seconds || 0, 0);
    }
}
