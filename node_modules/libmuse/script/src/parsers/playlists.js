"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_playlist_items = void 0;
exports.validate_playlist_id = validate_playlist_id;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const songs_js_1 = require("./songs.js");
const util_js_2 = require("./util.js");
const parse_playlist_items = (results, menu_entries) => {
    const songs = [];
    for (const result of results) {
        if (!(nav_js_1.MRLIR in result)) {
            continue;
        }
        const data = result[nav_js_1.MRLIR];
        let videoId = null, setVideoId = null, feedback_tokens = null;
        // if the item has a menu, find its setVideoId
        if ("menu" in data) {
            for (const item of (0, util_js_1.j)(data, nav_js_1.MENU_ITEMS)) {
                if ("menuServiceItemRenderer" in item) {
                    const menu_service = (0, util_js_1.j)(item, nav_js_1.MENU_SERVICE);
                    if ("playlistEditEndpoint" in menu_service) {
                        setVideoId = (0, util_js_1.j)(menu_service, "playlistEditEndpoint.actions.0.setVideoId");
                        videoId = (0, util_js_1.jo)(menu_service, "playlistEditEndpoint.actions.0.removeVideoId");
                    }
                }
                if (nav_js_1.TOGGLE_MENU in item) {
                    feedback_tokens = (0, songs_js_1.parse_song_menu_tokens)(item);
                }
            }
        }
        const play = (0, util_js_1.jo)(data, nav_js_1.PLAY_BUTTON);
        if (play != null) {
            if ("playNavigationEndpoint" in play) {
                videoId = (0, util_js_1.j)(play, "playNavigationEndpoint.watchEndpoint.videoId");
            }
        }
        const likeStatus = (0, songs_js_1.get_buttons_like_status)(data);
        const title = (0, util_js_2.get_item_text)(data, 0);
        if (title == "Song deleted") {
            continue;
        }
        const artists = (0, songs_js_1.parse_song_artists)(data, 1) ?? [];
        const album = (0, songs_js_1.parse_song_album)(data, 2);
        let duration = null;
        if ("fixedColumns" in data) {
            const column = (0, util_js_2.get_fixed_column_item)(data, 0);
            if ("simpleText" in column) {
                duration = (0, util_js_1.j)(column, "text.simpleText");
            }
            else {
                duration = (0, util_js_1.j)(column, "text.runs[0].text");
            }
        }
        let thumbnails = null;
        if ("thumbnail" in data) {
            thumbnails = (0, util_js_1.j)(data, nav_js_1.THUMBNAILS);
        }
        let isAvailable = true;
        if ("musicItemRendererDisplayPolicy" in data) {
            isAvailable = data.musicItemRendererDisplayPolicy !=
                "MUSIC_ITEM_RENDERER_DISPLAY_POLICY_GREY_OUT";
        }
        const isExplicit = (0, util_js_1.jo)(data, nav_js_1.BADGE_LABEL) != null;
        const videoType = (0, util_js_1.jo)(data, `${nav_js_1.MENU_ITEMS}[0].menuNavigationItemRenderer.navigationEndpoint.${nav_js_1.NAVIGATION_VIDEO_TYPE}`);
        const rank = (0, util_js_1.jo)(data, "customIndexColumn.musicCustomIndexColumnRenderer");
        const song = {
            videoId,
            title,
            artists,
            album,
            likeStatus,
            thumbnails,
            isAvailable,
            isExplicit,
            videoType,
            duration: null,
            duration_seconds: null,
            setVideoId: null,
            feedbackTokens: null,
            feedbackToken: null,
            rank: rank ? (0, util_js_1.j)(rank, nav_js_1.TEXT_RUN_TEXT) : null,
            change: rank ? (0, util_js_1.jo)(rank, "icon.iconType")?.split("_")[2] ?? null : null,
        };
        if (duration) {
            song.duration = duration;
            song.duration_seconds = (0, util_js_2.parse_duration)(duration);
        }
        if (setVideoId) {
            song.setVideoId = setVideoId;
        }
        if (feedback_tokens) {
            song.feedbackTokens = feedback_tokens;
        }
        if (menu_entries) {
            for (const menu_entry of menu_entries) {
                song.feedbackToken = (0, util_js_1.j)(data, `${nav_js_1.MENU_ITEMS}.${menu_entry.join(".")}`);
            }
        }
        songs.push(song);
    }
    return songs;
};
exports.parse_playlist_items = parse_playlist_items;
function validate_playlist_id(playlistId) {
    return playlistId.startsWith("VL") ? playlistId.slice(2) : playlistId;
}
