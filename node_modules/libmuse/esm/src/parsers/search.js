import { BADGE_LABEL, MRLIR, NAVIGATION_BROWSE_ID, NAVIGATION_PAGE_TYPE, NAVIGATION_PLAYLIST_ID, NAVIGATION_VIDEO_ID, NAVIGATION_VIDEO_TYPE, PLAY_BUTTON, SUBTITLE, SUBTITLE2, SUBTITLE_BADGE_LABEL, TEXT_RUN, TEXT_RUN_TEXT, TEXT_RUNS, THUMBNAILS, TITLE, TITLE_TEXT, } from "../nav.js";
import { j, jo } from "../util.js";
import { __ } from "./browsing.js";
import { get_library_like_status, get_menu_like_status, get_menu_tokens, get_shuffle_and_radio_ids, parse_song_artists_runs, parse_song_runs, } from "./songs.js";
import { get_flex_column_item, get_menu_playlists, } from "./util.js";
export const filters = [
    "albums",
    "artists",
    "playlists",
    "community_playlists",
    "featured_playlists",
    "songs",
    "videos",
    "profiles",
];
export const scopes = ["library", "uploads"];
export function get_search_params(filter = null, scope = null, autocorrect) {
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
export function _get_param2(filter) {
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
export function parse_search_album(result) {
    const flex = get_flex_column_item(result, 0);
    const flex1 = get_flex_column_item(result, 1);
    const title = j(flex, TEXT_RUN);
    const runs = j(flex1, TEXT_RUNS);
    return {
        type: "album",
        title: j(title, "text"),
        browseId: j(result, NAVIGATION_BROWSE_ID),
        isExplicit: jo(result, BADGE_LABEL) != null,
        thumbnails: j(result, THUMBNAILS),
        album_type: runs[0].text,
        year: runs[runs.length - 1].text,
        artists: parse_song_artists_runs(runs.slice(2, -1)),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_search_song(result, has_label = false) {
    const flex = get_flex_column_item(result, 0);
    const flex1 = get_flex_column_item(result, 1);
    const title = j(flex, TEXT_RUN);
    return {
        type: "song",
        title: j(title, "text"),
        videoId: j(flex, TEXT_RUN, NAVIGATION_VIDEO_ID),
        playlistId: jo(title, NAVIGATION_PLAYLIST_ID),
        thumbnails: j(result, THUMBNAILS),
        isExplicit: jo(result, BADGE_LABEL) != null,
        feedbackTokens: get_menu_tokens(result),
        videoType: j(result, PLAY_BUTTON, "playNavigationEndpoint", NAVIGATION_VIDEO_TYPE),
        likeStatus: get_menu_like_status(result),
        ...parse_song_runs(flex1.text.runs, has_label ? 2 : 0),
    };
}
export function parse_search_video(result, has_label = false) {
    return {
        ...parse_search_song(result, has_label),
        type: "video",
    };
}
export function parse_search_artist(result) {
    const flex = get_flex_column_item(result, 0);
    const flex1 = get_flex_column_item(result, 1);
    const title = j(flex, TEXT_RUN);
    return {
        type: "artist",
        name: j(title, "text"),
        subscribers: (flex1 && flex1.text.runs[2]?.text) ?? null,
        browseId: j(result, NAVIGATION_BROWSE_ID),
        thumbnails: j(result, THUMBNAILS),
        ...get_menu_playlists(result),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_search_profile(result) {
    const flex = get_flex_column_item(result, 0);
    const flex1 = get_flex_column_item(result, 1);
    const title = j(flex, TEXT_RUN);
    return {
        type: "profile",
        name: j(title, "text"),
        username: (flex1 && flex1.text.runs[2]?.text) ?? null,
        browseId: jo(result, NAVIGATION_BROWSE_ID),
        thumbnails: j(result, THUMBNAILS),
    };
}
export function parse_search_playlist(result, has_label = false) {
    const flex = get_flex_column_item(result, 0);
    const flex1 = get_flex_column_item(result, 1);
    const title = j(flex, TEXT_RUN);
    const authors = parse_song_artists_runs(flex1.text.runs.slice(has_label ? 2 : 0, -1));
    return {
        type: "playlist",
        title: j(title, "text"),
        songs: flex1.text.runs[2]?.text[0] ?? null,
        authors,
        browseId: j(result, NAVIGATION_BROWSE_ID),
        thumbnails: j(result, THUMBNAILS),
        libraryLikeStatus: get_library_like_status(result),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_search_radio(result) {
    const flex = get_flex_column_item(result, 0);
    const title = j(flex, TEXT_RUN);
    return {
        type: "radio",
        title: j(title, "text"),
        videoId: j(result, NAVIGATION_VIDEO_ID),
        playlistId: j(result, NAVIGATION_PLAYLIST_ID),
        thumbnails: j(result, THUMBNAILS),
    };
}
export function parse_search_content(result, upload = false, passed_entity) {
    const flex1 = get_flex_column_item(result, 1);
    // uploads artist won't have the second flex column
    const entity = passed_entity ||
        (flex1 ? __(j(flex1, TEXT_RUN_TEXT)) : "artist");
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
export function parse_search_results(results, scope, filter) {
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
        const data = result[MRLIR];
        search_results.push(parser(data));
    }
    return search_results.filter((e) => !!e);
}
export function parse_top_result_more(result) {
    const more = [];
    if (!("contents" in result))
        return more;
    const contents = j(result, "contents").map((content) => content.musicResponsiveListItemRenderer).filter(Boolean) ?? [];
    if (contents && contents.length > 0) {
        let last_entity = null;
        for (const content of contents) {
            const flex1 = get_flex_column_item(content, 1);
            const entity = flex1 ? __(jo(flex1, TEXT_RUN_TEXT)) : null;
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
export function parse_top_result_artist(result) {
    const subscribers = jo(result, SUBTITLE2);
    return {
        type: "artist",
        name: j(result, TITLE_TEXT),
        browseId: j(result, TITLE, NAVIGATION_BROWSE_ID),
        subscribers,
        thumbnails: j(result, THUMBNAILS),
        more: parse_top_result_more(result),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_top_result_song(result) {
    return {
        type: __(result.subtitle.runs[0].text) ?? "song",
        title: j(result, TITLE_TEXT),
        videoId: j(result, TITLE, NAVIGATION_VIDEO_ID),
        playlistId: jo(result, TITLE, NAVIGATION_PLAYLIST_ID),
        thumbnails: j(result, THUMBNAILS),
        isExplicit: jo(result, SUBTITLE_BADGE_LABEL) != null,
        feedbackTokens: get_menu_tokens(result),
        videoType: j(result, TITLE, "navigationEndpoint", NAVIGATION_VIDEO_TYPE),
        likeStatus: get_menu_like_status(result),
        ...parse_song_runs(result.subtitle.runs, 2),
        more: parse_top_result_more(result),
    };
}
export function parse_top_result_album(result) {
    return {
        type: "album",
        title: j(result, TITLE_TEXT),
        browseId: j(result, TITLE, NAVIGATION_BROWSE_ID),
        thumbnails: j(result, THUMBNAILS),
        isExplicit: jo(result, SUBTITLE_BADGE_LABEL) != null,
        // TODO: stop lowercasing for no reason (album_type, category title etc...)
        album_type: result.subtitle.runs[0].text,
        year: null,
        artists: parse_song_artists_runs(result.subtitle.runs.slice(2)),
        more: parse_top_result_more(result),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_top_result_playlist(result) {
    return {
        type: "playlist",
        title: j(result, TITLE_TEXT),
        browseId: j(result, TITLE, NAVIGATION_BROWSE_ID),
        thumbnails: j(result, THUMBNAILS),
        authors: parse_song_artists_runs(result.subtitle.runs.slice(2)),
        songs: null,
        description: jo(result, SUBTITLE),
        more: parse_top_result_more(result),
        libraryLikeStatus: get_library_like_status(result),
        ...get_shuffle_and_radio_ids(result),
    };
}
export function parse_top_result(result) {
    const page_type = jo(result, TITLE, NAVIGATION_PAGE_TYPE);
    switch (page_type) {
        case "MUSIC_PAGE_TYPE_ARTIST":
            return parse_top_result_artist(result);
        case "MUSIC_PAGE_TYPE_ALBUM":
            return parse_top_result_album(result);
        case "MUSIC_PAGE_TYPE_PLAYLIST":
            return parse_top_result_playlist(result);
        default:
            if (jo(result, TITLE, "navigationEndpoint", NAVIGATION_VIDEO_TYPE) != null) {
                return parse_top_result_song(result);
            }
            else {
                console.warn("unsupported search top result", page_type);
                return null;
            }
    }
}
