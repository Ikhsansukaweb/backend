"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_explore = get_explore;
exports.get_charts = get_charts;
exports.get_mood_categories = get_mood_categories;
exports.get_mood_playlists = get_mood_playlists;
exports.get_new_releases = get_new_releases;
const nav_js_1 = require("../nav.js");
const browsing_js_1 = require("../parsers/browsing.js");
const explore_js_1 = require("../parsers/explore.js");
const util_js_1 = require("../parsers/util.js");
const util_js_2 = require("../util.js");
const _request_js_1 = require("./_request.js");
async function get_explore(options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: { browseId: "FEmusic_explore" },
        signal: options.signal,
    });
    const results = (0, util_js_2.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST);
    return (0, browsing_js_1.parse_explore_contents)(results);
}
// any section may be missing
async function get_charts(country, options = {}) {
    const endpoint = "browse";
    const data = { browseId: "FEmusic_charts" };
    if (country) {
        data.formData = {
            selectedValues: [country],
        };
    }
    const json = await (0, _request_js_1.request_json)(endpoint, { data, signal: options.signal });
    const results = (0, util_js_2.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST);
    const menu = (0, util_js_2.j)(results[0], nav_js_1.MUSIC_SHELF, "subheaders.0.musicSideAlignedItemRenderer.startItems.0.musicSortFilterButtonRenderer");
    const menu_options = menu.menu.musicMultiSelectMenuRenderer.options
        .map((option) => {
        return option.musicMultiSelectMenuItemRenderer;
    })
        .filter(Boolean);
    const charts = {
        countries: (0, util_js_2.j)(json, nav_js_1.FRAMEWORK_MUTATIONS)
            .map((m) => {
            const data = (0, util_js_2.jo)(m, "payload.musicFormBooleanChoice");
            if (!data)
                return;
            const menu_option = menu_options.find((o) => o.formItemEntityKey === data.id);
            if (!menu_option)
                return;
            return {
                selected: data.selected,
                code: data.opaqueToken,
                title: (0, util_js_2.j)(menu_option, nav_js_1.TITLE_TEXT),
            };
        })
            .filter(Boolean),
        results: (0, browsing_js_1.parse_chart_contents)(results),
    };
    return charts;
}
async function get_mood_categories(options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: { browseId: "FEmusic_moods_and_genres" },
        signal: options.signal,
    });
    const mood_categories = {
        categories: (0, util_js_2.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST)
            .map((section) => {
            const title = (0, util_js_2.j)(section, nav_js_1.GRID, "header.gridHeaderRenderer", nav_js_1.TITLE_TEXT);
            const items = (0, util_js_2.j)(section, nav_js_1.GRID_ITEMS)
                .map((category) => {
                return {
                    title: (0, util_js_2.j)(category, nav_js_1.CATEGORY_TITLE, "0.text"),
                    color: (0, util_js_1.color_to_hex)((0, util_js_2.j)(category, nav_js_1.CATEGORY_COLOR)),
                    params: (0, util_js_2.j)(category, nav_js_1.CATEGORY_PARAMS),
                };
            });
            return { title, items };
        }),
    };
    return mood_categories;
}
async function get_mood_playlists(params, options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId: "FEmusic_moods_and_genres_category",
            params,
        },
        signal: options.signal,
    });
    const mood_playlists = {
        title: (0, util_js_2.j)(json, "header.musicHeaderRenderer", nav_js_1.TITLE_TEXT),
        categories: (0, explore_js_1.parse_playlists_categories)((0, util_js_2.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST)),
    };
    return mood_playlists;
}
async function get_new_releases(options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: { browseId: "FEmusic_new_releases" },
        signal: options.signal,
    });
    const new_releases = {
        title: (0, util_js_2.j)(json, "header.musicHeaderRenderer", nav_js_1.TITLE_TEXT),
        categories: (0, browsing_js_1.parse_mixed_content)((0, util_js_2.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST)),
    };
    return new_releases;
}
