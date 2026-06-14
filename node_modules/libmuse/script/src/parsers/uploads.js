"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_uploaded_items = parse_uploaded_items;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const songs_js_1 = require("./songs.js");
const util_js_2 = require("./util.js");
function parse_uploaded_items(results) {
    const songs = [];
    for (const result of results) {
        const data = result[nav_js_1.MRLIR];
        if (!("menu" in data)) {
            continue;
        }
        const menu_items = (0, util_js_1.j)(data, nav_js_1.MENU_ITEMS);
        const entityId = (0, util_js_1.j)(menu_items[menu_items.length - 1], "menuNavigationItemRenderer.navigationEndpoint.confirmDialogEndpoint.content.confirmDialogRenderer.confirmButton.buttonRenderer.command.musicDeletePrivatelyOwnedEntityCommand.entityId");
        const videoId = (0, util_js_1.j)(menu_items[0], nav_js_1.MENU_SERVICE, "queueAddEndpoint.queueTarget.videoId");
        const title = (0, util_js_2.get_item_text)(data, 0);
        const like = (0, util_js_1.j)(data, nav_js_1.MENU_LIKE_STATUS);
        const thumbnails = "thumbnail" in data ? (0, util_js_1.j)(data, nav_js_1.THUMBNAILS) : null;
        const duration = (0, util_js_2.get_fixed_column_item)(data, 0).text.runs[0].text;
        songs.push({
            entityId,
            videoId,
            title,
            duration,
            duration_seconds: (0, util_js_2.parse_duration)(duration),
            artists: (0, songs_js_1.parse_song_artists)(data, 1),
            album: (0, songs_js_1.parse_song_album)(data, 2),
            likeStatus: like,
            thumbnails,
        });
    }
    return songs;
}
