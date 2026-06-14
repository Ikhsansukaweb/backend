"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_library_artist = parse_library_artist;
exports.fetch_library_contents = fetch_library_contents;
exports.parse_library_songs = parse_library_songs;
exports.get_library_contents = get_library_contents;
exports.parse_toast = parse_toast;
const continuations_js_1 = require("../continuations.js");
const utils_js_1 = require("../mixins/utils.js");
const _request_js_1 = require("../mixins/_request.js");
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const playlists_js_1 = require("./playlists.js");
const util_js_2 = require("./util.js");
function parse_library_artist(data, has_subscribers = false) {
    const subtitle = (0, util_js_2.get_item_text)(data, 1);
    return {
        type: "library-artist",
        ...(0, util_js_2.get_menu_playlists)(data),
        browseId: (0, util_js_1.j)(data, nav_js_1.NAVIGATION_BROWSE_ID),
        name: (0, util_js_2.get_item_text)(data, 0),
        songs: !has_subscribers ? subtitle : null,
        subscribers: has_subscribers ? subtitle : null,
        thumbnails: (0, util_js_1.jo)(data, nav_js_1.THUMBNAILS),
    };
}
async function fetch_library_contents(browseId, options = {}, parse, grid) {
    const { order, limit = 20, continuation = null, signal } = options;
    await (0, utils_js_1.check_auth)();
    const data = { browseId };
    const endpoint = "browse";
    if (order != null) {
        data.params = (0, utils_js_1.prepare_order_params)(order);
    }
    const library_contents = {
        items: [],
        continuation: continuation,
    };
    if (!library_contents.continuation) {
        const json = await (0, _request_js_1.request_json)(endpoint, { data, signal });
        const results = get_library_contents(json, grid ? nav_js_1.GRID : nav_js_1.MUSIC_SHELF);
        if (results != null) {
            // console.log("results", parse(results.items ?? results.contents));
            library_contents.items = parse(results.items ?? results.contents);
            if ("continuations" in results) {
                library_contents.continuation = results;
            }
        }
    }
    if (library_contents.continuation) {
        const continued_data = await (0, continuations_js_1.get_continuations)(library_contents.continuation, grid ? "gridContinuation" : "musicShelfContinuation", limit - library_contents.items.length, (params) => {
            return (0, _request_js_1.request_json)(endpoint, { data, params, signal });
        }, (contents) => {
            return parse(contents);
        });
        library_contents.items.push(...continued_data.items);
        library_contents.continuation = continued_data.continuation;
    }
    return library_contents;
}
function parse_library_songs(response) {
    const results = get_library_contents(response, nav_js_1.MUSIC_SHELF);
    return {
        results: results,
        parsed: results ? (0, playlists_js_1.parse_playlist_items)(results.contents.slice(1)) : null,
    };
}
/**
 * Find library contents. This function is a bit messy now
 * as it is supporting two different response types. Can be
 * cleaned up once all users are migrated to the new responses.
 */
function get_library_contents(response, renderer) {
    const section = (0, util_js_1.jo)(response, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST);
    let contents = null;
    if (section == null) {
        // empty library
        contents = (0, util_js_1.jo)(response, nav_js_1.SINGLE_COLUMN, nav_js_1.TAB_1_CONTENT, nav_js_1.SECTION_LIST_ITEM, renderer);
    }
    else {
        const results = (0, nav_js_1.find_object_by_key)(section, "itemSectionRenderer");
        if (results == null) {
            contents = (0, util_js_1.jo)(response, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, renderer);
        }
        else {
            contents = (0, util_js_1.jo)(results, nav_js_1.ITEM_SECTION, renderer);
        }
    }
    return contents;
}
function parse_toast(json) {
    const action = (0, util_js_1.jo)(json, "actions.0.addToToastAction.item.notificationActionRenderer.responseText") ??
        (0, util_js_1.jo)(json, "actions.0.addToToastAction.item.notificationTextRenderer.successResponseText");
    if (action) {
        return action.runs.map((run) => run.text).join("");
    }
    else {
        return null;
    }
}
