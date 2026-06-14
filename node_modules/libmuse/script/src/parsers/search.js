"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopes = exports.filters = void 0;
exports.get_search_params = get_search_params;
exports._get_param2 = _get_param2;
exports.parse_search_album = parse_search_album;
exports.parse_search_song = parse_search_song;
exports.parse_search_video = parse_search_video;
exports.parse_search_artist = parse_search_artist;
exports.parse_search_profile = parse_search_profile;
exports.parse_search_playlist = parse_search_playlist;
exports.parse_search_radio = parse_search_radio;
exports.parse_search_content = parse_search_content;
exports.parse_search_results = parse_search_results;
exports.parse_top_result_more = parse_top_result_more;
exports.parse_top_result_artist = parse_top_result_artist;
exports.parse_top_result_song = parse_top_result_song;
exports.parse_top_result_album = parse_top_result_album;
exports.parse_top_result_playlist = parse_top_result_playlist;
exports.parse_top_result = parse_top_result;
const nav_js_1 = require("../nav.js");
const util_js_1 = require("../util.js");
const browsing_js_1 = require("./browsing.js");
const songs_js_1 = require("./songs.js");
const util_js_2 = require("./util.js");
exports.filters = [
    "albums",
    "artists",
    "playlists",
    "community_playlists",
    "featured_playlists",
    "songs",
    "videos",
    "profiles",
];
exports.scopes = ["library", "uploads"];
function get_search_params(filter = null, scope = null, autocorrect) {
    if (filter == null && scope == null && autocorrect) {
        return null;
    }
    switch (scope) {
        case null:
            if (autocorrect) {
                switch (filter) {
                    case null:
                        return null;
                    case "songs":
                    case "videos":
                    case "albums":
                    case "artists":
                    case "playlists":
                        return `EgWKAQI${_get_param2(filter)}AWoMEAMQBBAJEA4QChAF`;
                    case "featured_playlists":
                    case "community_playlists":
                        return `EgeKAQQoA${_get_param2(filter)}BagwQAxAEEAkQDhAKEAU%3D`;
                    case "profiles":
                        return "EgWKAQJYAWoMEAMQBBAJEAoQBRAV";
                }
            }
            else {
                switch (filter) {
                    case null:
                        return "QgIIAQ%3D%3D";
                    case "songs":
                    case "videos":
                    case "albums":
                    case "artists":
                    case "playlists":
                        return `EgWKAQI${_get_param2(filter)}AWoIEAMQBBAJEAo%3D`;
                    case "featured_playlists":
                    case "community_playlists":
                        return `EgeKAQQoA${_get_param2(filter)}BaggQAxAEEAkQCg%3D%3D`;
                    case "profiles":
                        return "EgWKAQJYAUICCAFqDBADEAQQCRAKEAUQFQ%3D%3D";
                }
            }
            break;
        case "library":
            switch (filter) {
                case "artists":
                case "albums":
                case "songs":
                    // note that `videos` is not supported here
                    return `EgWKAQI${_get_param2(filter)}AWoIEAUQCRADGAQ%3D`;
                case "playlists":
                    return "EgWKAQIoAWoEEAoYBA%3D%3D";
                default:
                    return "agIYBA%3D%3D";
            }
            break;
        case "uploads":
            return "agIYAw%3D%3D";
    }
}
function _get_param2(filter) {
    switch (filter) {
        case "songs":
            return "I";
        case "videos":
            return "Q";
        case "albums":
            return "Y";
        case "artists":
            return "g";
        case "playlists":
            return "o";
        case "featured_playlists":
            return "Dg";
        case "community_playlists":
            return "EA";
        default:
            throw Error("Invalid filter: " + filter);
    }
}
function parse_search_album(result) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    const runs = (0, util_js_1.j)(flex1, nav_js_1.TEXT_RUNS);
    return {
        type: "album",
        title: (0, util_js_1.j)(title, "text"),
        browseId: (0, util_js_1.j)(result, nav_js_1.NAVIGATION_BROWSE_ID),
        isExplicit: (0, util_js_1.jo)(result, nav_js_1.BADGE_LABEL) != null,
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        album_type: runs[0].text,
        year: runs[runs.length - 1].text,
        artists: (0, songs_js_1.parse_song_artists_runs)(runs.slice(2, -1)),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_search_song(result, has_label = false) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    return {
        type: "song",
        title: (0, util_js_1.j)(title, "text"),
        videoId: (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN, nav_js_1.NAVIGATION_VIDEO_ID),
        playlistId: (0, util_js_1.jo)(title, nav_js_1.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        isExplicit: (0, util_js_1.jo)(result, nav_js_1.BADGE_LABEL) != null,
        feedbackTokens: (0, songs_js_1.get_menu_tokens)(result),
        videoType: (0, util_js_1.j)(result, nav_js_1.PLAY_BUTTON, "playNavigationEndpoint", nav_js_1.NAVIGATION_VIDEO_TYPE),
        likeStatus: (0, songs_js_1.get_menu_like_status)(result),
        ...(0, songs_js_1.parse_song_runs)(flex1.text.runs, has_label ? 2 : 0),
    };
}
function parse_search_video(result, has_label = false) {
    return {
        ...parse_search_song(result, has_label),
        type: "video",
    };
}
function parse_search_artist(result) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    return {
        type: "artist",
        name: (0, util_js_1.j)(title, "text"),
        subscribers: (flex1 && flex1.text.runs[2]?.text) ?? null,
        browseId: (0, util_js_1.j)(result, nav_js_1.NAVIGATION_BROWSE_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        ...(0, util_js_2.get_menu_playlists)(result),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_search_profile(result) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    return {
        type: "profile",
        name: (0, util_js_1.j)(title, "text"),
        username: (flex1 && flex1.text.runs[2]?.text) ?? null,
        browseId: (0, util_js_1.jo)(result, nav_js_1.NAVIGATION_BROWSE_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
    };
}
function parse_search_playlist(result, has_label = false) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    const authors = (0, songs_js_1.parse_song_artists_runs)(flex1.text.runs.slice(has_label ? 2 : 0, -1));
    return {
        type: "playlist",
        title: (0, util_js_1.j)(title, "text"),
        songs: flex1.text.runs[2]?.text[0] ?? null,
        authors,
        browseId: (0, util_js_1.j)(result, nav_js_1.NAVIGATION_BROWSE_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        libraryLikeStatus: (0, songs_js_1.get_library_like_status)(result),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_search_radio(result) {
    const flex = (0, util_js_2.get_flex_column_item)(result, 0);
    const title = (0, util_js_1.j)(flex, nav_js_1.TEXT_RUN);
    return {
        type: "radio",
        title: (0, util_js_1.j)(title, "text"),
        videoId: (0, util_js_1.j)(result, nav_js_1.NAVIGATION_VIDEO_ID),
        playlistId: (0, util_js_1.j)(result, nav_js_1.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
    };
}
function parse_search_content(result, upload = false, passed_entity) {
    const flex1 = (0, util_js_2.get_flex_column_item)(result, 1);
    // uploads artist won't have the second flex column
    const entity = passed_entity ||
        (flex1 ? (0, browsing_js_1.__)((0, util_js_1.j)(flex1, nav_js_1.TEXT_RUN_TEXT)) : "artist");
    let parser;
    switch (entity) {
        case "station":
            parser = parse_search_radio;
            break;
        case "playlist":
            parser = parse_search_playlist;
            break;
        case "artist":
            parser = parse_search_artist;
            break;
        case "song":
            parser = parse_search_song;
            break;
        case "video":
            parser = parse_search_video;
            break;
        case "profile":
            parser = parse_search_profile;
            break;
        default:
            parser = (e) => {
                if (upload && flex1.text.runs.length > 3) {
                    return parse_search_song(e);
                }
                try {
                    return parse_search_album(e);
                }
                catch {
                    try {
                        return parse_search_song(e);
                    }
                    catch {
                        return null;
                    }
                }
            };
    }
    return parser(result, true);
}
function parse_search_results(results, scope, filter) {
    const search_results = [];
    let parser;
    if (scope == null || scope == "library") {
        switch (filter) {
            case "albums":
                parser = parse_search_album;
                break;
            case "artists":
                parser = parse_search_artist;
                break;
            case "community_playlists":
            case "featured_playlists":
            case "playlists":
                parser = parse_search_playlist;
                break;
            case "songs":
                parser = parse_search_song;
                break;
            case "videos":
                parser = parse_search_video;
                break;
            case "profiles":
                parser = parse_search_profile;
                break;
            case null:
                parser = parse_search_content;
        }
    }
    else {
        parser = (e) => parse_search_content(e, true);
    }
    for (const result of results) {
        const data = result[nav_js_1.MRLIR];
        search_results.push(parser(data));
    }
    return search_results.filter((e) => !!e);
}
function parse_top_result_more(result) {
    const more = [];
    if (!("contents" in result))
        return more;
    const contents = (0, util_js_1.j)(result, "contents").map((content) => content.musicResponsiveListItemRenderer).filter(Boolean) ?? [];
    if (contents && contents.length > 0) {
        let last_entity = null;
        for (const content of contents) {
            const flex1 = (0, util_js_2.get_flex_column_item)(content, 1);
            const entity = flex1 ? (0, browsing_js_1.__)((0, util_js_1.jo)(flex1, nav_js_1.TEXT_RUN_TEXT)) : null;
            if (entity) {
                more.push(parse_search_content(content, false));
                last_entity = entity;
            }
            else {
                try {
                    more.push(parse_search_content(content, false, last_entity ?? undefined));
                }
                catch {
                    // try as album
                    try {
                        more.push(parse_search_content(content, false, "album"));
                    }
                    catch {
                        // try as song
                        try {
                            more.push(parse_search_content(content, false, "song"));
                        }
                        catch {
                            // ignore
                        }
                        // ignore
                    }
                }
            }
        }
    }
    return more.filter((e) => !!e);
}
function parse_top_result_artist(result) {
    const subscribers = (0, util_js_1.jo)(result, nav_js_1.SUBTITLE2);
    return {
        type: "artist",
        name: (0, util_js_1.j)(result, nav_js_1.TITLE_TEXT),
        browseId: (0, util_js_1.j)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_BROWSE_ID),
        subscribers,
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        more: parse_top_result_more(result),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_top_result_song(result) {
    return {
        type: (0, browsing_js_1.__)(result.subtitle.runs[0].text) ?? "song",
        title: (0, util_js_1.j)(result, nav_js_1.TITLE_TEXT),
        videoId: (0, util_js_1.j)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_VIDEO_ID),
        playlistId: (0, util_js_1.jo)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        isExplicit: (0, util_js_1.jo)(result, nav_js_1.SUBTITLE_BADGE_LABEL) != null,
        feedbackTokens: (0, songs_js_1.get_menu_tokens)(result),
        videoType: (0, util_js_1.j)(result, nav_js_1.TITLE, "navigationEndpoint", nav_js_1.NAVIGATION_VIDEO_TYPE),
        likeStatus: (0, songs_js_1.get_menu_like_status)(result),
        ...(0, songs_js_1.parse_song_runs)(result.subtitle.runs, 2),
        more: parse_top_result_more(result),
    };
}
function parse_top_result_album(result) {
    return {
        type: "album",
        title: (0, util_js_1.j)(result, nav_js_1.TITLE_TEXT),
        browseId: (0, util_js_1.j)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_BROWSE_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        isExplicit: (0, util_js_1.jo)(result, nav_js_1.SUBTITLE_BADGE_LABEL) != null,
        // TODO: stop lowercasing for no reason (album_type, category title etc...)
        album_type: result.subtitle.runs[0].text,
        year: null,
        artists: (0, songs_js_1.parse_song_artists_runs)(result.subtitle.runs.slice(2)),
        more: parse_top_result_more(result),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_top_result_playlist(result) {
    return {
        type: "playlist",
        title: (0, util_js_1.j)(result, nav_js_1.TITLE_TEXT),
        browseId: (0, util_js_1.j)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_BROWSE_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_1.THUMBNAILS),
        authors: (0, songs_js_1.parse_song_artists_runs)(result.subtitle.runs.slice(2)),
        songs: null,
        description: (0, util_js_1.jo)(result, nav_js_1.SUBTITLE),
        more: parse_top_result_more(result),
        libraryLikeStatus: (0, songs_js_1.get_library_like_status)(result),
        ...(0, songs_js_1.get_shuffle_and_radio_ids)(result),
    };
}
function parse_top_result(result) {
    const page_type = (0, util_js_1.jo)(result, nav_js_1.TITLE, nav_js_1.NAVIGATION_PAGE_TYPE);
    switch (page_type) {
        case "MUSIC_PAGE_TYPE_ARTIST":
            return parse_top_result_artist(result);
        case "MUSIC_PAGE_TYPE_ALBUM":
            return parse_top_result_album(result);
        case "MUSIC_PAGE_TYPE_PLAYLIST":
            return parse_top_result_playlist(result);
        default:
            if ((0, util_js_1.jo)(result, nav_js_1.TITLE, "navigationEndpoint", nav_js_1.NAVIGATION_VIDEO_TYPE) != null) {
                return parse_top_result_song(result);
            }
            else {
                console.warn("unsupported search top result", page_type);
                return null;
            }
    }
}
