import { CATEGORY_COLOR, CATEGORY_PARAMS, CATEGORY_TITLE, FRAMEWORK_MUTATIONS, GRID, GRID_ITEMS, MUSIC_SHELF, SECTION_LIST, SINGLE_COLUMN_TAB, TITLE_TEXT, } from "../nav.js";
import { parse_chart_contents, parse_explore_contents, parse_mixed_content, } from "../parsers/browsing.js";
import { parse_playlists_categories, } from "../parsers/explore.js";
import { color_to_hex } from "../parsers/util.js";
import { j, jo } from "../util.js";
import { request_json } from "./_request.js";
export async function get_explore(options = {}) {
    const json = await request_json("browse", {
        data: { browseId: "FEmusic_explore" },
        signal: options.signal,
    });
    const results = j(json, SINGLE_COLUMN_TAB, SECTION_LIST);
    return parse_explore_contents(results);
}
// any section may be missing
export async function get_charts(country, options = {}) {
    const endpoint = "browse";
    const data = { browseId: "FEmusic_charts" };
    if (country) {
        data.formData = {
            selectedValues: [country],
        };
    }
    const json = await request_json(endpoint, { data, signal: options.signal });
    const results = j(json, SINGLE_COLUMN_TAB, SECTION_LIST);
    const menu = j(results[0], MUSIC_SHELF, "subheaders.0.musicSideAlignedItemRenderer.startItems.0.musicSortFilterButtonRenderer");
    const menu_options = menu.menu.musicMultiSelectMenuRenderer.options
        .map((option) => {
        return option.musicMultiSelectMenuItemRenderer;
    })
        .filter(Boolean);
    const charts = {
        countries: j(json, FRAMEWORK_MUTATIONS)
            .map((m) => {
            const data = jo(m, "payload.musicFormBooleanChoice");
            if (!data)
                return;
            const menu_option = menu_options.find((o) => o.formItemEntityKey === data.id);
            if (!menu_option)
                return;
            return {
                selected: data.selected,
                code: data.opaqueToken,
                title: j(menu_option, TITLE_TEXT),
            };
        })
            .filter(Boolean),
        results: parse_chart_contents(results),
    };
    return charts;
}
export async function get_mood_categories(options = {}) {
    const json = await request_json("browse", {
        data: { browseId: "FEmusic_moods_and_genres" },
        signal: options.signal,
    });
    const mood_categories = {
        categories: j(json, SINGLE_COLUMN_TAB, SECTION_LIST)
            .map((section) => {
            const title = j(section, GRID, "header.gridHeaderRenderer", TITLE_TEXT);
            const items = j(section, GRID_ITEMS)
                .map((category) => {
                return {
                    title: j(category, CATEGORY_TITLE, "0.text"),
                    color: color_to_hex(j(category, CATEGORY_COLOR)),
                    params: j(category, CATEGORY_PARAMS),
                };
            });
            return { title, items };
        }),
    };
    return mood_categories;
}
export async function get_mood_playlists(params, options = {}) {
    const json = await request_json("browse", {
        data: {
            browseId: "FEmusic_moods_and_genres_category",
            params,
        },
        signal: options.signal,
    });
    const mood_playlists = {
        title: j(json, "header.musicHeaderRenderer", TITLE_TEXT),
        categories: parse_playlists_categories(j(json, SINGLE_COLUMN_TAB, SECTION_LIST)),
    };
    return mood_playlists;
}
export async function get_new_releases(options = {}) {
    const json = await request_json("browse", {
        data: { browseId: "FEmusic_new_releases" },
        signal: options.signal,
    });
    const new_releases = {
        title: j(json, "header.musicHeaderRenderer", TITLE_TEXT),
        categories: parse_mixed_content(j(json, SINGLE_COLUMN_TAB, SECTION_LIST)),
    };
    return new_releases;
}
