"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_playlists_categories = parse_playlists_categories;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const browsing_js_1 = require("./browsing.js");
function parse_playlists_categories(results) {
    const categories = [];
    for (const section of results) {
        let path = null;
        let title = null;
        let params = null;
        if ("gridRenderer" in section) {
            path = nav_js_1.GRID_ITEMS;
            title = (0, util_js_1.jo)(section, nav_js_1.GRID, "header.gridHeaderRenderer", nav_js_1.TITLE_TEXT);
        }
        else if ("musicCarouselShelfRenderer" in section) {
            path = nav_js_1.CAROUSEL_CONTENTS;
            title = (0, util_js_1.j)(section, nav_js_1.CAROUSEL, nav_js_1.CAROUSEL_TITLE, "text");
            params = (0, util_js_1.jo)(section, nav_js_1.CAROUSEL, nav_js_1.CAROUSEL_TITLE, nav_js_1.NAVIGATION_PARAMS);
        }
        else if ("musicImmersiveCarouselShelfRenderer" in section) {
            path = "musicImmersiveCarouselShelfRenderer.contents";
            title = (0, util_js_1.j)(section, nav_js_1.TITLE);
        }
        if (path) {
            const results = (0, util_js_1.j)(section, path);
            categories.push({
                title,
                params,
                playlists: (0, browsing_js_1.parse_content_list)(results, browsing_js_1.parse_mixed_item),
            });
        }
    }
    return categories;
}
