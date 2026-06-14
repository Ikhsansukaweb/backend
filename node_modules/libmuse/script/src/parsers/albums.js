"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_album_header = parse_album_header;
const nav_js_1 = require("../nav.js");
const nav_js_2 = require("../nav.js");
const nav_js_3 = require("../nav.js");
const nav_js_4 = require("../nav.js");
const util_js_1 = require("../util.js");
const browsing_js_1 = require("./browsing.js");
const songs_js_1 = require("./songs.js");
const util_js_2 = require("./util.js");
function parse_album_header(header) {
    const playButton = (0, nav_js_3.find_object_by_key)(header.buttons, "musicPlayButtonRenderer")
        .musicPlayButtonRenderer;
    const description_runs = (0, util_js_1.jo)(header, "description", nav_js_1.DESCRIPTION_SHELF, "description.runs");
    const album = {
        // the last header button
        ...(0, util_js_2.get_menu_playlists)({ menu: header.buttons.slice(-1)[0] }),
        title: (0, util_js_1.j)(header, nav_js_4.TITLE_TEXT),
        album_type: (0, util_js_1.j)(header, nav_js_4.SUBTITLE),
        thumbnails: (0, util_js_1.j)(header, nav_js_2.THUMBNAILS),
        isExplicit: (0, util_js_1.jo)(header, nav_js_1.SINGLE_BADGE_LABEL) != null,
        trackCount: null,
        duration: null,
        audioPlaylistId: (0, util_js_1.jo)(playButton, nav_js_4.PLAY_PLAYLIST_ID),
        description: description_runs
            ? (0, browsing_js_1.parse_description_runs)(description_runs)
            : null,
        likeStatus: (0, songs_js_1.get_library_like_status)({
            menu: (0, nav_js_3.find_object_by_key)(header.buttons, "menuRenderer"),
        }),
        artists: (0, songs_js_1.parse_song_artists_runs)(header.straplineTextOne.runs),
        year: (0, util_js_1.j)(header, "subtitle.runs", (header.subtitle.runs.length - 1).toString(), "text"),
    };
    if (header.secondSubtitle.runs.length > 1) {
        album.trackCount = header.secondSubtitle.runs[0].text;
        album.duration = header.secondSubtitle.runs[2].text;
    }
    else {
        album.duration = header.secondSubtitle.runs[0].text;
    }
    return album;
}
