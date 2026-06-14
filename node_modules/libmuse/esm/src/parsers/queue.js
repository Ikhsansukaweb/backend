import { BADGE_LABEL, MENU_ITEMS, NAVIGATION_VIDEO_TYPE, THUMBNAIL, TITLE_TEXT, TOGGLE_MENU, } from "../nav.js";
import { j, jo } from "../util.js";
import { parse_song_menu_tokens, parse_song_runs, } from "./songs.js";
import { parse_duration } from "./util.js";
export function parse_queue_playlist(results) {
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
export function parse_queue_track(data) {
    let feedback_tokens = null, like_status = null;
    for (const item of j(data, MENU_ITEMS)) {
        if (TOGGLE_MENU in item) {
            const service = item[TOGGLE_MENU].defaultServiceEndpoint;
            // console.log("idk", service);
            if ("feedbackEndpoint" in service) {
                feedback_tokens = parse_song_menu_tokens(item);
            }
            if ("likeEndpoint" in service) {
                like_status = item[TOGGLE_MENU].defaultIcon.iconType === "FAVORITE"
                    ? "INDIFFERENT"
                    : "LIKE";
            }
        }
    }
    const song_info = parse_song_runs(data.longBylineText?.runs ?? []);
    const duration = jo(data, "lengthText.runs.0.text");
    return {
        ...song_info,
        videoId: data.videoId,
        title: j(data, TITLE_TEXT),
        duration: duration,
        duration_seconds: duration ? parse_duration(duration) : null,
        thumbnails: j(data, THUMBNAIL),
        feedbackTokens: feedback_tokens,
        likeStatus: like_status,
        videoType: jo(data, "navigationEndpoint", NAVIGATION_VIDEO_TYPE),
        isExplicit: jo(data, BADGE_LABEL) != null,
        counterpart: null,
    };
}
export function get_tab_browse_id(watchNextRenderer, tab_id) {
    if (!("unselectable" in watchNextRenderer.tabs[tab_id].tabRenderer)) {
        return watchNextRenderer.tabs[tab_id].tabRenderer.endpoint.browseEndpoint
            .browseId;
    }
    else {
        return null;
    }
}
