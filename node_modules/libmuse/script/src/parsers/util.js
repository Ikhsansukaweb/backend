"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_menu_playlists = get_menu_playlists;
exports.get_item_text = get_item_text;
exports.get_flex_column_item = get_flex_column_item;
exports.get_fixed_column_item = get_fixed_column_item;
exports.parse_duration = parse_duration;
exports.get_browse_id = get_browse_id;
exports.get_dot_separator_index = get_dot_separator_index;
exports.color_to_hex = color_to_hex;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
function get_menu_playlists(data) {
    const ids = {
        shuffleId: null,
        radioId: null,
    };
    const watch_menu = (0, nav_js_1.find_objects_by_key)((0, util_js_1.j)(data, nav_js_1.MENU_ITEMS), "menuNavigationItemRenderer");
    for (const item of watch_menu.map((menu) => menu.menuNavigationItemRenderer)) {
        const icon = (0, util_js_1.j)(item, "icon.iconType");
        const watch_id = (0, util_js_1.jo)(item, "navigationEndpoint.watchPlaylistEndpoint.playlistId") ??
            (0, util_js_1.jo)(item, "navigationEndpoint.watchEndpoint.playlistId");
        if (icon == "MUSIC_SHUFFLE") {
            ids["shuffleId"] = watch_id;
        }
        else if (icon == "MIX") {
            ids["radioId"] = watch_id;
        }
        else {
            continue;
        }
    }
    return ids;
}
function get_item_text(item, index, run_index = 0) {
    const column = get_flex_column_item(item, index);
    if (!column)
        return null;
    if (column.text.runs.length < run_index + 1)
        return null;
    return column.text.runs[run_index].text;
}
function get_flex_column_item(item, index) {
    if (item.flexColumns.length <= index ||
        !("text" in
            item.flexColumns[index].musicResponsiveListItemFlexColumnRenderer) ||
        !("runs" in
            item.flexColumns[index].musicResponsiveListItemFlexColumnRenderer.text)) {
        return null;
    }
    return item.flexColumns[index].musicResponsiveListItemFlexColumnRenderer;
}
function get_fixed_column_item(item, index) {
    if (!("text" in
        item.fixedColumns[index].musicResponsiveListItemFixedColumnRenderer) ||
        !("runs" in
            item.fixedColumns[index].musicResponsiveListItemFixedColumnRenderer.text)) {
        return null;
    }
    return item.fixedColumns[index].musicResponsiveListItemFixedColumnRenderer;
}
function parse_duration(duration) {
    if (duration == null)
        return null;
    const mappedIncrements = [
        ...zip([1, 60, 3600], duration.split(":").reverse()),
    ];
    const seconds = mappedIncrements.reduce((acc, [multiplier, time]) => acc + (multiplier * parseInt(time)), 0);
    return seconds;
}
function zip(a, b) {
    return Array.from({ length: Math.min(a.length, b.length) }, (_, i) => [a[i], b[i]]);
}
function get_browse_id(item, index) {
    if (!("navigationEndpoint" in item.text.runs[index])) {
        return null;
    }
    else {
        return (0, util_js_1.j)(item, `text.runs[${index}].${nav_js_1.NAVIGATION_BROWSE_ID}`);
    }
}
function get_dot_separator_index(runs) {
    const index = runs.findIndex((run) => run.text === " • ");
    return index < 0 ? runs.length : index;
}
function color_to_hex(a) {
    const arr = [
        (a & 16711680) >>> 16,
        (a & 65280) >>> 8,
        a & 255,
        (a & 4278190080) >>> 24,
    ];
    const b = arr.every((c) => c == (c & 255));
    if (!b)
        throw Error('"(' + arr.join(",") + '") is not a valid RGBA color');
    return ("#" +
        arr
            .slice(0, 3)
            .map((c) => c.toString(16).padStart(2, "0"))
            .join(""));
}
