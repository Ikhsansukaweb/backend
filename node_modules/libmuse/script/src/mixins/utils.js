"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.library_orders = exports.library_order_continuations = exports.orders = exports.order_params = exports.get_option = void 0;
exports.prepare_like_endpoint = prepare_like_endpoint;
exports.get_timestamp = get_timestamp;
exports.check_auth = check_auth;
exports.html_to_text = html_to_text;
exports.validate_order_parameter = validate_order_parameter;
exports.prepare_order_params = prepare_order_params;
exports.validate_library_sort_parameter = validate_library_sort_parameter;
exports.prepare_library_sort_params = prepare_library_sort_params;
exports.randomString = randomString;
exports.get_sort_options = get_sort_options;
const errors_js_1 = require("../errors.js");
const nav_js_1 = require("../nav.js");
const setup_js_1 = require("../setup.js");
Object.defineProperty(exports, "get_option", { enumerable: true, get: function () { return setup_js_1.get_option; } });
const util_js_1 = require("../util.js");
function prepare_like_endpoint(status) {
    switch (status.toUpperCase()) {
        case "LIKE":
            return "like/like";
        case "DISLIKE":
            return "like/dislike";
        case "INDIFFERENT":
            return "like/removelike";
        default:
            throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.INVALID_PARAMETER, `Invalid like status: ${status}`);
    }
}
/**
 * Get number of days since the unix epoch
 */
function get_timestamp() {
    const one_day = 24 * 60 * 60 * 1000;
    return Math.round((new Date().getTime() - new Date(0).getTime()) / one_day) -
        7;
}
async function check_auth() {
    if (await (0, setup_js_1.get_option)("auth").requires_login()) {
        throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.AUTH_REQUIRED, "Please provide authentication before using this function");
    }
}
function html_to_text(html) {
    return html.replace(/<[^>]*>?/gm, "");
}
// determine order_params via `.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[1].itemSectionRenderer.header.itemSectionTabbedHeaderRenderer.endItems[1].dropdownRenderer.entries[].dropdownItemRenderer.onSelectCommand.browseEndpoint.params` of `/youtubei/v1/browse` response
exports.order_params = new Map([
    ["a_to_z", "ggMGKgQIARAA"],
    ["z_to_a", "ggMGKgQIARAB"],
    ["recently_added", "ggMGKgQIABAB"],
]);
exports.orders = [...exports.order_params.keys()];
function validate_order_parameter(order) {
    if (order && !exports.orders.includes(order)) {
        throw new Error(`Invalid order provided. Please use one of the following: ${exports.orders.join(", ")}`);
    }
}
function prepare_order_params(order) {
    if (order) {
        return exports.order_params.get(order);
    }
}
exports.library_order_continuations = new Map([
    [
        "recent_activity",
        "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCaEFCb0FZQg%3D%3D",
    ],
    [
        "recently_added",
        "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlBQkFCb0FZQg%3D%3D",
    ],
    [
        "recently_played",
        "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCUkFCb0FZQg%3D%3D",
    ],
]);
exports.library_orders = [...exports.library_order_continuations.keys()];
function validate_library_sort_parameter(sort) {
    if (sort && !exports.library_orders.includes(sort)) {
        throw new Error(`Invalid sort provided. Please use one of the following: ${exports.library_orders.join(", ")}`);
    }
}
function prepare_library_sort_params(sort) {
    if (sort) {
        return exports.library_order_continuations.get(sort);
    }
}
const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function randomString(len) {
    return [...Array(len)].reduce((a) => a + p[~~(Math.random() * p.length)], "");
}
function get_sort_options(chips) {
    const sort = (0, util_js_1.j)(chips.find((chip) => "musicSortFilterButtonRenderer" in chip), "musicSortFilterButtonRenderer");
    const selected = (0, util_js_1.j)(sort, nav_js_1.TITLE_TEXT);
    const options = (0, util_js_1.j)(sort, "menu.musicMultiSelectMenuRenderer.options")
        .map((option) => {
        const renderer = (0, util_js_1.j)(option, "musicMultiSelectMenuItemRenderer");
        return {
            title: (0, util_js_1.j)(renderer, nav_js_1.TITLE_TEXT),
            continuation: (0, util_js_1.j)(renderer, "selectedCommand.commandExecutorCommand.commands")
                .filter((option) => option.browseSectionListReloadEndpoint != null)
                .map((option) => option.browseSectionListReloadEndpoint.continuation
                .reloadContinuationData.continuation)[0],
        };
    });
    return {
        selected,
        options,
    };
}
