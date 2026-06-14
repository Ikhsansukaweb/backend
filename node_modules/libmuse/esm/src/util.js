import { JSONPath } from "./deps.js";
import { ERROR_CODE, MuseError } from "./errors.js";
import { get_option } from "./setup.js";
/**
 * Wait a given number of milliseconds, then resolve
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Logs debug messages to the console
 */
export const debug = (...args) => {
    if (get_option("debug"))
        console.debug(...args);
};
export const jom = (json, path, resultType) => {
    const result = JSONPath({ path, json: json, resultType });
    return result.length ? result : null;
};
export const jo = (json, path, ...others) => {
    const result = JSONPath({
        path: [path, ...others].join("."),
        json: json,
    });
    return result.length ? result[0] : null;
};
export const j = (json, path, ...others) => {
    const result = jo(json, path, ...others);
    if (result == null) {
        throw new MuseError(ERROR_CODE.PARSING_INVALID_JSON, `JSONPath expression "${[path, ...others]}" returned nothing`);
    }
    return result;
};
export function sum_total_duration(item) {
    if (!("tracks" in item)) {
        return 0;
    }
    else {
        return item.tracks.reduce((acc, track) => acc + track.duration_seconds || 0, 0);
    }
}
