"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse_moods = parse_moods;
exports.parse_mixed_item = parse_mixed_item;
exports.parse_mixed_content = parse_mixed_content;
exports.parse_categories = parse_categories;
exports.parse_channel_contents = parse_channel_contents;
exports.parse_artist_contents = parse_artist_contents;
exports.parse_explore_contents = parse_explore_contents;
exports.parse_chart_contents = parse_chart_contents;
exports.parse_content_list = parse_content_list;
exports.parse_mood_or_genre = parse_mood_or_genre;
exports.parse_album = parse_album;
exports.parse_single = parse_single;
exports.parse_song = parse_song;
exports.parse_song_flat = parse_song_flat;
exports.parse_video = parse_video;
exports.parse_top_song = parse_top_song;
exports.parse_top_video = parse_top_video;
exports.parse_top_artist = parse_top_artist;
exports.parse_trending = parse_trending;
exports.parse_playlist = parse_playlist;
exports.parse_related_artist = parse_related_artist;
exports.parse_watch_playlist = parse_watch_playlist;
exports._ = _;
exports.__ = __;
exports.is_ranked = is_ranked;
exports.find_context_param = find_context_param;
exports.parse_two_columns = parse_two_columns;
exports.parse_description_runs = parse_description_runs;
const strings_js_1 = __importDefault(require("../../locales/strings.js"));
const nav_js_1 = require("../nav.js");
const nav_js_2 = require("../nav.js");
const setup_js_1 = require("../setup.js");
const util_js_1 = require("../util.js");
const songs_js_1 = require("./songs.js");
const songs_js_2 = require("./songs.js");
const util_js_2 = require("./util.js");
function parse_moods(results) {
    const moods = [];
    const chips = (0, util_js_1.j)(results, "sectionListRenderer.header.chipCloudRenderer.chips");
    chips.forEach((chip) => {
        const renderer = (0, util_js_1.j)(chip, "chipCloudChipRenderer");
        moods.push({
            name: (0, util_js_1.j)(renderer, nav_js_2.TEXT_RUN_TEXT),
            selected: (0, util_js_1.j)(renderer, "isSelected"),
            params: (0, util_js_1.j)(renderer, "navigationEndpoint.browseEndpoint.params"),
        });
    });
    return moods;
}
function parse_mixed_item(data) {
    let item = null;
    const page_type = (0, util_js_1.jo)(data, nav_js_2.TITLE, nav_js_2.NAVIGATION_PAGE_TYPE);
    switch (page_type) {
        case null:
        case undefined:
            // song or watch playlist
            if ((0, util_js_1.jo)(data, nav_js_2.NAVIGATION_WATCH_PLAYLIST_ID) != null) {
                item = parse_watch_playlist(data);
            }
            else {
                const content = parse_song(data);
                if (content.views != null) {
                    item = {
                        ...content,
                        type: "inline-video",
                    };
                }
                else {
                    item = {
                        ...content,
                        type: "song",
                    };
                }
            }
            break;
        case "MUSIC_PAGE_TYPE_ALBUM":
            item = parse_album(data);
            break;
        case "MUSIC_PAGE_TYPE_USER_CHANNEL":
        case "MUSIC_PAGE_TYPE_ARTIST":
            item = {
                ...parse_related_artist(data),
                type: page_type === "MUSIC_PAGE_TYPE_USER_CHANNEL"
                    ? "channel"
                    : "artist",
            };
            break;
        case "MUSIC_PAGE_TYPE_PLAYLIST":
            item = parse_playlist(data);
            break;
        default:
            console.error("Unknown page type", page_type);
    }
    return item;
}
function parse_mixed_content(rows) {
    const items = [];
    for (const row of rows) {
        let title = null, contents, browseId = null, subtitle = null, thumbnails = null, display = null;
        if (nav_js_2.DESCRIPTION_SHELF in row) {
            const results = (0, util_js_1.j)(row, nav_js_2.DESCRIPTION_SHELF);
            // type = "description";
            title = (0, util_js_1.j)(results, "header", nav_js_2.RUN_TEXT);
            contents = (0, util_js_1.j)(results, nav_js_2.DESCRIPTION);
        }
        else {
            const results = Object.values(row)[0];
            let children;
            if (!("contents" in results)) {
                if ("items" in results) {
                    children = results["items"];
                }
                else {
                    continue;
                }
            }
            else {
                const carousel_title = (0, util_js_1.j)(results, nav_js_2.CAROUSEL_TITLE);
                title = (0, util_js_1.j)(carousel_title, "text");
                browseId = (0, util_js_1.jo)(carousel_title, nav_js_2.NAVIGATION_BROWSE_ID);
                subtitle = (0, util_js_1.jo)(results, nav_js_2.CAROUSEL_SUBTITLE, "text");
                thumbnails = (0, util_js_1.jo)(results, nav_js_2.CAROUSEL_THUMBNAILS);
                children = results["contents"];
            }
            contents = [];
            for (const result of children) {
                const data = (0, util_js_1.jo)(result, nav_js_2.MTRIR);
                let item = null;
                if (data != null) {
                    const mixed_item = parse_mixed_item(data);
                    if (mixed_item != null) {
                        item = mixed_item;
                    }
                }
                else {
                    const data = (0, util_js_1.j)(result, nav_js_2.MRLIR);
                    display = "list";
                    item = parse_song_flat(data);
                }
                contents.push(item);
            }
        }
        items.push({
            title,
            subtitle,
            thumbnails,
            browseId,
            contents,
            display,
        });
    }
    return items;
}
function parse_categories(results, categories_data) {
    const categories = {};
    for (const category in categories_data) {
        // const category = categories[i];
        const value = categories_data[category];
        const category_local = value[0];
        const category_parser = value[1];
        const category_key = value[2];
        const data = results
            .filter((r) => "musicCarouselShelfRenderer" in r &&
            (0, util_js_1.j)(r, `${nav_js_2.CAROUSEL}.${nav_js_2.CAROUSEL_TITLE}`).text == category_local)
            .map((r) => r.musicCarouselShelfRenderer);
        if (data.length > 0) {
            const category_obj = {
                browseId: null,
                results: [],
                params: null,
            };
            if ("navigationEndpoint" in (0, util_js_1.j)(data[0], nav_js_2.CAROUSEL_TITLE)) {
                category_obj.browseId = (0, util_js_1.j)(data[0], nav_js_2.CAROUSEL_TITLE, nav_js_2.NAVIGATION_BROWSE_ID);
                category_obj.params = (0, util_js_1.jo)(data[0], nav_js_2.CAROUSEL_TITLE, nav_js_2.NAVIGATION_BROWSE, "params");
            }
            category_obj.results = parse_content_list(data[0].contents, category_parser, category_key);
            categories[category] = category_obj;
        }
    }
    return categories;
}
function parse_channel_contents(results) {
    const categories_data = {
        artists_on_repeat: [_("artists_on_repeat"), parse_related_artist],
        playlists_on_repeat: [_("playlists_on_repeat"), parse_playlist],
        videos: [_("videos"), parse_video],
        playlists: [_("playlists"), parse_playlist],
    };
    return parse_categories(results, categories_data);
}
function parse_artist_contents(results) {
    const categories_data = {
        albums: [_("albums"), parse_album],
        singles: [_("singles"), parse_single],
        videos: [_("videos"), parse_video],
        playlists: [_("playlists"), parse_playlist],
        related: [_("related"), parse_related_artist],
        featured: [_("featured"), parse_playlist],
        library: [_("library"), parse_mixed_item],
    };
    return parse_categories(results, categories_data);
}
function parse_explore_contents(results) {
    const categories_data = {
        albums: [_("new albums"), parse_album],
        songs: [_("top songs"), parse_top_song, nav_js_2.MRLIR],
        moods: [
            _("moods"),
            parse_mood_or_genre,
            "musicNavigationButtonRenderer",
        ],
        trending: [_("trending"), parse_trending, nav_js_2.MRLIR],
        videos: [_("new videos"), parse_top_video],
    };
    return parse_categories(results, categories_data);
}
function parse_chart_contents(results) {
    const categories_data = {
        // In exceedingly rare cases, songs may contain both songs and videos
        songs: [_("top songs"), parse_trending, nav_js_2.MRLIR],
        videos: [_("top videos"), parse_top_video],
        genres: [_("genres"), parse_playlist],
        artists: [_("top artists"), parse_top_artist, nav_js_2.MRLIR],
        trending: [_("trending"), parse_trending, nav_js_2.MRLIR],
    };
    return parse_categories(results, categories_data);
}
function parse_content_list(results, parse_func, key = nav_js_2.MTRIR) {
    const contents = [];
    for (const result of results) {
        const list = result?.[key];
        if (!list)
            continue;
        const data = parse_func(list);
        if (data) {
            contents.push(data);
        }
    }
    return contents;
}
function parse_mood_or_genre(result) {
    return {
        title: (0, util_js_1.j)(result, "buttonText.runs[0].text"),
        color: (0, util_js_2.color_to_hex)((0, util_js_1.j)(result, "solid.leftStripeColor")),
        params: (0, util_js_1.j)(result, "clickCommand.browseEndpoint.params"),
    };
}
function parse_album(result) {
    const SUBTITLE_RUNS = "subtitle.runs";
    const subtitles = (0, util_js_1.j)(result, SUBTITLE_RUNS);
    const runs = (0, songs_js_2.parse_song_artists_runs)(subtitles.slice(2));
    const year = subtitles[subtitles.length - 1].text;
    const is_year = year.match(/^\d{4}$/);
    if (is_year) {
        runs.pop();
    }
    const playlistId = (0, util_js_1.jo)(result, "thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchEndpoint")?.playlistId ?? (0, util_js_1.j)(result, "thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchPlaylistEndpoint").playlistId;
    return {
        type: "album",
        title: (0, util_js_1.j)(result, nav_js_2.TITLE_TEXT),
        year: is_year ? year : null,
        browseId: (0, util_js_1.j)(result, nav_js_2.TITLE, nav_js_2.NAVIGATION_BROWSE_ID),
        audioPlaylistId: playlistId,
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAIL_RENDERER),
        isExplicit: (0, util_js_1.jo)(result, nav_js_2.SUBTITLE_BADGE_LABEL) != null,
        album_type: (0, util_js_1.j)(result, nav_js_2.SUBTITLE),
        artists: runs,
        libraryLikeStatus: (0, songs_js_2.get_library_like_status)(result),
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(result),
    };
}
function parse_single(result) {
    const SUBTITLE_RUNS = "subtitle.runs";
    const subtitles = (0, util_js_1.j)(result, SUBTITLE_RUNS);
    const runs = (0, songs_js_2.parse_song_artists_runs)(subtitles.slice(2));
    const year = subtitles[subtitles.length - 1].text;
    const is_year = year.match(/^\d{4}$/);
    if (is_year) {
        runs.pop();
    }
    const playlistId = (0, util_js_1.jo)(result, "thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchEndpoint")?.playlistId ?? (0, util_js_1.j)(result, "thumbnailOverlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchPlaylistEndpoint").playlistId;
    return {
        type: "album",
        title: (0, util_js_1.j)(result, nav_js_2.TITLE_TEXT),
        year: is_year ? year : null,
        browseId: (0, util_js_1.j)(result, nav_js_2.TITLE, nav_js_2.NAVIGATION_BROWSE_ID),
        audioPlaylistId: playlistId,
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAIL_RENDERER),
        isExplicit: (0, util_js_1.jo)(result, nav_js_2.SUBTITLE_BADGE_LABEL) != null,
        artists: runs,
        album_type: null,
        libraryLikeStatus: (0, songs_js_2.get_library_like_status)(result),
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(result),
    };
}
function parse_song(result) {
    return {
        type: "song",
        title: (0, util_js_1.j)(result, nav_js_2.TITLE_TEXT),
        videoId: (0, util_js_1.j)(result, nav_js_2.NAVIGATION_VIDEO_ID),
        playlistId: (0, util_js_1.jo)(result, nav_js_2.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAIL_RENDERER),
        isExplicit: (0, util_js_1.jo)(result, nav_js_2.SUBTITLE_BADGE_LABEL) != null,
        feedbackTokens: (0, songs_js_2.get_menu_tokens)(result),
        likeStatus: (0, songs_js_2.get_menu_like_status)(result),
        ...(0, songs_js_2.parse_song_runs)(result.subtitle.runs),
    };
}
function parse_song_flat(data) {
    const columns = [];
    for (let i = 0; i < data.flexColumns.length; i++) {
        columns.push((0, util_js_2.get_flex_column_item)(data, i));
    }
    const song = {
        type: "flat-song",
        title: (0, util_js_1.j)(columns[0], nav_js_2.TEXT_RUN_TEXT),
        videoId: (0, util_js_1.jo)(columns[0], nav_js_2.TEXT_RUN, nav_js_2.NAVIGATION_VIDEO_ID),
        artists: (0, songs_js_2.parse_song_artists)(data, 1),
        thumbnails: (0, util_js_1.j)(data, nav_js_2.THUMBNAILS),
        isExplicit: (0, util_js_1.jo)(data, nav_js_2.BADGE_LABEL) != null,
        album: null,
        views: null,
        likeStatus: (0, songs_js_1.get_buttons_like_status)(data),
    };
    if (columns.length > 2 && columns[2] != null &&
        "navigationEndpoint" in (0, util_js_1.j)(columns[2], nav_js_2.TEXT_RUN)) {
        song.album = {
            name: (0, util_js_1.j)(columns[2], nav_js_2.TEXT_RUN_TEXT),
            id: (0, util_js_1.j)(columns[2], nav_js_2.TEXT_RUN, nav_js_2.NAVIGATION_BROWSE_ID),
        };
    }
    else {
        song.views = (0, util_js_1.jo)(columns[1], `text.runs[-1].text`);
    }
    return song;
}
function parse_video(result) {
    const runs = result.subtitle.runs;
    const artists_len = (0, util_js_2.get_dot_separator_index)(runs);
    return {
        type: "video",
        title: (0, util_js_1.j)(result, nav_js_2.TITLE_TEXT),
        videoId: (0, util_js_1.j)(result, nav_js_2.NAVIGATION_VIDEO_ID),
        artists: (0, songs_js_2.parse_song_artists_runs)(runs.slice(0, artists_len)),
        playlistId: (0, util_js_1.jo)(result, nav_js_2.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAIL_RENDERER),
        views: runs[runs.length - 1].text,
        likeStatus: (0, songs_js_2.get_menu_like_status)(result),
    };
}
function parse_top_song(result) {
    const title = (0, util_js_2.get_flex_column_item)(result, 0);
    const title_run = (0, util_js_1.j)(title, nav_js_2.TEXT_RUN);
    const rank = (0, util_js_1.j)(result, "customIndexColumn.musicCustomIndexColumnRenderer");
    const album_run = (0, util_js_1.jo)((0, util_js_2.get_flex_column_item)(result, result.flexColumns.length - 1) ?? {}, nav_js_2.TEXT_RUN);
    return {
        type: "song",
        title: (0, util_js_1.j)(title_run, "text"),
        videoId: (0, util_js_1.jo)(title_run, nav_js_2.NAVIGATION_VIDEO_ID) ??
            (0, util_js_1.j)(title_run, nav_js_2.NAVIGATION_BROWSE_ID),
        artists: (0, songs_js_2.parse_song_artists)(result, 1) ?? [],
        playlistId: (0, util_js_1.jo)(title_run, nav_js_2.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAILS),
        rank: (0, util_js_1.j)(rank, nav_js_2.TEXT_RUN_TEXT),
        change: (0, util_js_1.jo)(rank, "icon.iconType")?.split("_")[2] || null,
        isExplicit: (0, util_js_1.jo)(result, nav_js_2.BADGE_LABEL) != null,
        views: null,
        duration: null,
        duration_seconds: null,
        year: null,
        album: album_run &&
            album_run.displayPriority ==
                "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH"
            ? {
                name: (0, util_js_1.j)(album_run, "text"),
                id: (0, util_js_1.jo)(album_run, nav_js_2.NAVIGATION_VIDEO_ID) ??
                    (0, util_js_1.j)(album_run, nav_js_2.NAVIGATION_BROWSE_ID),
            }
            : null,
        feedbackTokens: (0, songs_js_2.get_menu_tokens)(result),
        likeStatus: (0, songs_js_2.get_menu_like_status)(result),
    };
}
function parse_top_video(result) {
    const runs = result.subtitle.runs;
    const artists_len = (0, util_js_2.get_dot_separator_index)(runs);
    const rank = (0, util_js_1.jo)(result, "customIndexColumn.musicCustomIndexColumnRenderer");
    return {
        type: "video",
        title: (0, util_js_1.j)(result, nav_js_2.TITLE_TEXT),
        videoId: (0, util_js_1.jo)(result, nav_js_2.NAVIGATION_VIDEO_ID) ??
            (0, util_js_1.j)(result, nav_js_2.NAVIGATION_BROWSE_ID),
        artists: (0, songs_js_2.parse_song_artists_runs)(runs.slice(0, artists_len)),
        playlistId: (0, util_js_1.jo)(result, nav_js_2.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAIL_RENDERER),
        views: runs[runs.length - 1].text,
        rank: rank ? (0, util_js_1.jo)(rank, nav_js_2.TEXT_RUN_TEXT) : null,
        change: (rank && (0, util_js_1.jo)(rank, "icon.iconType")?.split("_")[2]) ?? null,
        likeStatus: (0, songs_js_2.get_menu_like_status)(result),
    };
}
function parse_top_artist(result) {
    const rank = (0, util_js_1.j)(result, "customIndexColumn.musicCustomIndexColumnRenderer");
    return {
        type: "artist",
        name: (0, util_js_1.j)((0, util_js_2.get_flex_column_item)(result, 0), nav_js_2.TEXT_RUN_TEXT),
        browseId: (0, util_js_1.j)(result, nav_js_2.NAVIGATION_BROWSE_ID),
        subscribers: (0, util_js_1.j)((0, util_js_2.get_flex_column_item)(result, 1), nav_js_2.TEXT_RUN_TEXT),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAILS),
        rank: (0, util_js_1.j)(rank, nav_js_2.TEXT_RUN_TEXT),
        change: (0, util_js_1.jo)(rank, "icon.iconType")?.split("_")[2] || null,
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(result),
    };
}
function parse_trending(result) {
    const title = (0, util_js_2.get_flex_column_item)(result, 0);
    const title_run = (0, util_js_1.j)(title, nav_js_2.TEXT_RUN);
    const last_flex = (0, util_js_2.get_flex_column_item)(result, result.flexColumns.length - 1) ??
        (0, util_js_2.get_flex_column_item)(result, result.flexColumns.length - 2);
    const last_runs = (0, util_js_1.jo)(last_flex, nav_js_2.TEXT_RUNS);
    const rank = (0, util_js_1.j)(result, "customIndexColumn.musicCustomIndexColumnRenderer");
    const album_run = (0, util_js_1.jo)((0, util_js_2.get_flex_column_item)(result, result.flexColumns.length - 1) ?? {}, nav_js_2.TEXT_RUN);
    const data = {
        title: (0, util_js_1.j)(title_run, "text"),
        videoId: (0, util_js_1.jo)(title_run, nav_js_2.NAVIGATION_VIDEO_ID) ??
            (0, util_js_1.j)(title_run, nav_js_2.NAVIGATION_BROWSE_ID),
        artists: (0, songs_js_2.parse_song_artists)(result, 1, album_run ? undefined : -1) ?? [],
        playlistId: (0, util_js_1.jo)(title_run, nav_js_2.NAVIGATION_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(result, nav_js_2.THUMBNAILS),
        rank: (0, util_js_1.j)(rank, nav_js_2.TEXT_RUN_TEXT),
        change: (0, util_js_1.jo)(rank, "icon.iconType")?.split("_")[2] || null,
        year: null,
        duration: null,
        duration_seconds: null,
        isExplicit: (0, util_js_1.jo)(result, nav_js_2.BADGE_LABEL) != null,
        views: null,
        feedbackTokens: (0, songs_js_2.get_menu_tokens)(result),
        likeStatus: (0, songs_js_2.get_menu_like_status)(result),
    };
    if (album_run) {
        return {
            type: "song",
            ...data,
            album: album_run &&
                album_run.displayPriority ==
                    "MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH"
                ? {
                    name: (0, util_js_1.j)(album_run, "text"),
                    id: (0, util_js_1.jo)(album_run, nav_js_2.NAVIGATION_VIDEO_ID) ??
                        (0, util_js_1.j)(album_run, nav_js_2.NAVIGATION_BROWSE_ID),
                }
                : null,
        };
    }
    else {
        return {
            type: "video",
            ...data,
            views: last_runs[last_runs.length - 1]?.text ?? null,
        };
    }
}
function parse_playlist(data) {
    const subtitles = (0, util_js_1.j)(data, "subtitle.runs");
    const has_data = subtitles[0]?.text === _("playlist");
    const has_songs = subtitles.length > 3;
    const playlist = {
        type: "playlist",
        title: (0, util_js_1.j)(data, nav_js_2.TITLE_TEXT),
        playlistId: (0, util_js_1.j)(data, nav_js_2.TITLE, nav_js_2.NAVIGATION_BROWSE_ID).slice(2),
        thumbnails: (0, util_js_1.j)(data, nav_js_2.THUMBNAIL_RENDERER),
        songs: has_data && has_songs
            ? (0, util_js_1.j)(subtitles[subtitles.length - 1], "text")
            : null,
        authors: has_data
            ? (0, songs_js_2.parse_song_artists_runs)(subtitles.slice(2, has_songs ? -1 : undefined))
            : null,
        description: null,
        count: null,
        author: null,
        libraryLikeStatus: (0, songs_js_2.get_library_like_status)(data),
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(data),
    };
    const subtitle = data.subtitle;
    if ("runs" in subtitle) {
        playlist.description = subtitle.runs.map((run) => run.text).join("");
        if (subtitle.runs.length == 3 &&
            (0, util_js_1.j)(data, nav_js_2.SUBTITLE2).match(/\d+ /)) {
            playlist.count = (0, util_js_1.j)(data, nav_js_2.SUBTITLE2);
            // TODO: why are we getting "author" 2 times?
            playlist.author = (0, songs_js_2.parse_song_artists_runs)(subtitle.runs.slice(0, 1));
        }
    }
    return playlist;
}
function parse_related_artist(data) {
    const subscribers = (0, util_js_1.jo)(data, nav_js_2.SUBTITLE2);
    return {
        type: "artist",
        name: (0, util_js_1.j)(data, nav_js_2.TITLE_TEXT),
        browseId: (0, util_js_1.j)(data, nav_js_2.TITLE, nav_js_2.NAVIGATION_BROWSE_ID),
        subscribers,
        thumbnails: (0, util_js_1.j)(data, nav_js_2.THUMBNAIL_RENDERER),
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(data),
    };
}
function parse_watch_playlist(data) {
    return {
        type: "watch-playlist",
        title: (0, util_js_1.j)(data, nav_js_2.TITLE_TEXT),
        playlistId: (0, util_js_1.j)(data, nav_js_2.NAVIGATION_WATCH_PLAYLIST_ID),
        thumbnails: (0, util_js_1.j)(data, nav_js_2.THUMBNAIL_RENDERER),
        ...(0, songs_js_2.get_shuffle_and_radio_ids)(data),
    };
}
function _(id) {
    const result = strings_js_1.default[(0, setup_js_1.get_option)("language")];
    return result?.[id] ?? id;
}
function __(value) {
    // does the reverse of _()
    // it returns the key of the string or null if it doesn't exist
    const result = strings_js_1.default[(0, setup_js_1.get_option)("language")];
    if (result) {
        for (const key in result) {
            if (result[key] === value) {
                return key;
            }
        }
    }
    return null;
}
function is_ranked(item) {
    return typeof item.rank === "string";
}
function find_context_param(json, key) {
    return (0, util_js_1.j)(json, "responseContext.serviceTrackingParams[0].params").find((param) => param.key === key).value;
}
function parse_two_columns(json) {
    const renderer = (0, util_js_1.j)(json, "contents", nav_js_2.TWO_COLUMN_RESULTS);
    return {
        secondary: renderer.secondaryContents,
        tab: (0, util_js_1.j)(renderer, nav_js_1.TAB_CONTENT),
    };
}
function parse_description_runs(runs) {
    return runs.map((run) => {
        return (0, util_js_1.jo)(run, "navigationEndpoint.urlEndpoint.url") ?? run.text;
    }).join("");
}
