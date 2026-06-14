"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_queue_playlist = parse_queue_playlist;
exports.parse_queue_track = parse_queue_track;
exports.get_tab_browse_id = get_tab_browse_id;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const songs_js_1 = require("./songs.js");
const util_js_2 = require("./util.js");
function parse_queue_playlist(results) {
    const tracks = [];
    const PPVWR = "playlistPanelVideoWrapperRenderer";
    const PPVR = "playlistPanelVideoRenderer";
    for (const result of results) {
        let counterpart = null, renderer = result;
        if (PPVWR in result) {
            counterpart = result[PPVWR].counterpart[0].counterpartRenderer[PPVR];
            renderer = result[PPVWR].primaryRenderer;
        }
        if (!(PPVR in renderer)) {
            continue;
        }
        const data = renderer[PPVR];
        if ("unplayableText" in data) {
            continue;
        }
        const track = parse_queue_track(data);
        if (counterpart) {
            track.counterpart = parse_queue_track(counterpart);
        }
        tracks.push(track);
    }
    return tracks;
}
function parse_queue_track(data) {
    let feedback_tokens = null, like_status = null;
    for (const item of (0, util_js_1.j)(data, nav_js_1.MENU_ITEMS)) {
        if (nav_js_1.TOGGLE_MENU in item) {
            const service = item[nav_js_1.TOGGLE_MENU].defaultServiceEndpoint;
            // console.log("idk", service);
            if ("feedbackEndpoint" in service) {
                feedback_tokens = (0, songs_js_1.parse_song_menu_tokens)(item);
            }
            if ("likeEndpoint" in service) {
                like_status = item[nav_js_1.TOGGLE_MENU].defaultIcon.iconType === "FAVORITE"
                    ? "INDIFFERENT"
                    : "LIKE";
            }
        }
    }
    const song_info = (0, songs_js_1.parse_song_runs)(data.longBylineText?.runs ?? []);
    const duration = (0, util_js_1.jo)(data, "lengthText.runs.0.text");
    return {
        ...song_info,
        videoId: data.videoId,
        title: (0, util_js_1.j)(data, nav_js_1.TITLE_TEXT),
        duration: duration,
        duration_seconds: duration ? (0, util_js_2.parse_duration)(duration) : null,
        thumbnails: (0, util_js_1.j)(data, nav_js_1.THUMBNAIL),
        feedbackTokens: feedback_tokens,
        likeStatus: like_status,
        videoType: (0, util_js_1.jo)(data, "navigationEndpoint", nav_js_1.NAVIGATION_VIDEO_TYPE),
        isExplicit: (0, util_js_1.jo)(data, nav_js_1.BADGE_LABEL) != null,
        counterpart: null,
    };
}
function get_tab_browse_id(watchNextRenderer, tab_id) {
    if (!("unselectable" in watchNextRenderer.tabs[tab_id].tabRenderer)) {
        return watchNextRenderer.tabs[tab_id].tabRenderer.endpoint.browseEndpoint
            .browseId;
    }
    else {
        return null;
    }
}
