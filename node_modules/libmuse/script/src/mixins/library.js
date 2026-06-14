"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_library_items = get_library_items;
exports.get_library_playlists = get_library_playlists;
exports.get_library = get_library;
exports.get_library_songs = get_library_songs;
exports.get_library_albums = get_library_albums;
exports.get_library_artists = get_library_artists;
exports.get_library_subscriptions = get_library_subscriptions;
exports.get_liked_songs = get_liked_songs;
exports.add_history_item = add_history_item;
exports.remove_history_items = remove_history_items;
exports.rate_song = rate_song;
exports.edit_song_library_status = edit_song_library_status;
exports.rate_playlist = rate_playlist;
exports.subscribe_artists = subscribe_artists;
exports.unsubscribe_artists = unsubscribe_artists;
exports.get_history = get_history;
exports.get_current_user = get_current_user;
const continuations_js_1 = require("../continuations.js");
const nav_js_1 = require("../nav.js");
const browsing_js_1 = require("../parsers/browsing.js");
const library_js_1 = require("../parsers/library.js");
const playlists_js_1 = require("../parsers/playlists.js");
const util_js_1 = require("../util.js");
const playlist_js_1 = require("./playlist.js");
const utils_js_1 = require("./utils.js");
const _request_js_1 = require("./_request.js");
async function get_library_items(browseId, tab_index, options = {}) {
    const { order, limit = 20, continuation } = options;
    await (0, utils_js_1.check_auth)();
    const endpoint = "browse";
    const data = {
        browseId,
    };
    const order_continuation = (0, utils_js_1.prepare_library_sort_params)(order);
    if (order_continuation) {
        data.continuation = order_continuation;
    }
    const library = {
        continuation: null,
        results: [],
    };
    if (continuation) {
        library.continuation = continuation;
    }
    else {
        const json = await (0, _request_js_1.request_json)(endpoint, { data, signal: options.signal });
        let grid;
        if (order_continuation) {
            grid = (0, util_js_1.j)(json, nav_js_1.SECTION_LIST_CONTINUATION, `[${tab_index.toString()}]`, nav_js_1.GRID);
        }
        else {
            grid = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN, "tabs", `[${tab_index.toString()}]`, "tabRenderer.content", nav_js_1.SECTION_LIST, "[0]", nav_js_1.GRID);
        }
        const results = (0, util_js_1.j)(grid, "items");
        library.results = results.map((result) => (0, browsing_js_1.parse_mixed_item)((0, util_js_1.j)(result, nav_js_1.MTRIR)));
        library.continuation = (0, util_js_1.jo)(grid, "continuations[0].nextContinuationData.continuation");
    }
    if (library.continuation) {
        const continued_data = await (0, continuations_js_1.get_continuations)(library.continuation, "gridContinuation", limit - library.results.length, (params) => {
            return (0, _request_js_1.request_json)(endpoint, {
                data,
                params,
                signal: options.signal,
            });
        }, (contents) => {
            return contents.map((result) => (0, browsing_js_1.parse_mixed_item)((0, util_js_1.j)(result, nav_js_1.MTRIR)));
        });
        library.continuation = continued_data.continuation;
        library.results.push(...continued_data.items);
    }
    return library;
}
function get_library_playlists(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_liked_playlists", options, (playlists) => (0, browsing_js_1.parse_content_list)(playlists, (content) => {
        if (!content.subtitle)
            return null;
        return (0, browsing_js_1.parse_playlist)(content);
    }, nav_js_1.MTRIR), true);
}
function get_library(options = {}) {
    return get_library_items("FEmusic_library_landing", 0, options);
}
async function get_library_songs(options = {}) {
    const { order, limit = 25, validate_responses = false, continuation } = options;
    await (0, utils_js_1.check_auth)();
    const endpoint = "browse";
    const data = {
        browseId: "FEmusic_liked_videos",
    };
    const per_page = 25;
    (0, utils_js_1.validate_order_parameter)(order);
    if (order) {
        data.params = (0, utils_js_1.prepare_order_params)(order);
    }
    const request = (_params = {}) => (0, _request_js_1.request_json)(endpoint, {
        data,
        signal: options.signal,
    });
    const parse = (response) => (0, library_js_1.parse_library_songs)(response);
    const library_songs = {
        items: [],
        continuation: continuation ?? null,
    };
    if (!continuation) {
        let response = null;
        if (validate_responses) {
            response = await (0, continuations_js_1.resend_request_until_valid)(request, {}, parse, (parsed) => (0, continuations_js_1.validate_response)(parsed, per_page, limit, 0), 3);
        }
        else {
            response = parse(await request());
        }
        library_songs.items = response.parsed ?? [];
        library_songs.continuation = response.results;
    }
    if (library_songs.continuation) {
        const request_continuations = (params) => (0, _request_js_1.request_json)(endpoint, { data, params, signal: options.signal });
        const parse_continuations = (contents) => (0, playlists_js_1.parse_playlist_items)(contents);
        if (validate_responses) {
            const continued_data = await (0, continuations_js_1.get_validated_continuations)(library_songs.continuation, "musicShelfContinuation", limit - library_songs.items.length, per_page, request_continuations, parse_continuations);
            library_songs.continuation = continued_data.continuation;
            library_songs.items.push(...continued_data.items);
        }
        else {
            const remaining_limit = limit == null
                ? null
                : limit - library_songs.items.length;
            const continued_data = await (0, continuations_js_1.get_continuations)(library_songs.continuation, "musicShelfContinuation", remaining_limit, request_continuations, parse_continuations);
            library_songs.continuation = continued_data.continuation;
            library_songs.items.push(...continued_data.items);
        }
    }
    return library_songs;
}
function get_library_albums(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_liked_albums", options, (albums) => (0, browsing_js_1.parse_content_list)(albums, browsing_js_1.parse_album), true);
}
function get_library_artists(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_library_corpus_track_artists", options, (artists) => (0, browsing_js_1.parse_content_list)(artists, library_js_1.parse_library_artist, nav_js_1.MRLIR), false);
}
function get_library_subscriptions(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_library_corpus_artists", options, (subs) => (0, browsing_js_1.parse_content_list)(subs, (sub) => (0, library_js_1.parse_library_artist)(sub, true), nav_js_1.MRLIR), false);
}
async function get_liked_songs(options) {
    await (0, utils_js_1.check_auth)();
    return (0, playlist_js_1.get_playlist)("LM", options);
}
function add_history_item(song, options = {}) {
    const url = typeof song === "string" ? song : song.videostatsPlaybackUrl;
    return (0, _request_js_1.request)(url, {
        method: "get",
        params: {
            ver: "2",
            cpn: (0, utils_js_1.randomString)(16),
            c: "WEB_REMIX",
        },
        signal: options.signal,
    });
}
async function remove_history_items(feedbackTokens, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = (0, _request_js_1.request_json)("feedback", {
        data: { feedbackTokens },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function rate_song(videoId, status, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)((0, utils_js_1.prepare_like_endpoint)(status), {
        data: {
            target: {
                videoId,
            },
        },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function edit_song_library_status(feedbackTokens, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("feedback", {
        data: { feedbackTokens },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function rate_playlist(playlistId, status, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)((0, utils_js_1.prepare_like_endpoint)(status), {
        data: {
            target: {
                playlistId: (0, playlists_js_1.validate_playlist_id)(playlistId),
            },
        },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function subscribe_artists(channelIds, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("subscription/subscribe", {
        data: {
            channelIds,
        },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function unsubscribe_artists(channelIds, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("subscription/unsubscribe", {
        data: {
            channelIds,
        },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function get_history() {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId: "FEmusic_history",
        },
    });
    const results = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST);
    const history = {
        categories: [],
    };
    for (const content of results) {
        const data = (0, util_js_1.jo)(content, nav_js_1.MUSIC_SHELF, "contents");
        if (!data) {
            // I'm not sure what this means...
            throw new Error((0, util_js_1.jo)(content, "musicNotifierShelfRenderer", nav_js_1.TITLE));
        }
        const songlist = (0, playlists_js_1.parse_playlist_items)(data, [[
                "-1:",
                nav_js_1.MENU_SERVICE,
                nav_js_1.FEEDBACK_TOKEN,
            ]]);
        const category = {
            title: (0, util_js_1.j)(content, nav_js_1.MUSIC_SHELF, nav_js_1.TITLE_TEXT),
            items: songlist,
        };
        history.categories.push(category);
    }
    return history;
}
async function get_current_user(options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("account/account_menu", {
        signal: options.signal,
    });
    const renderer = (0, util_js_1.j)(json, "actions.0.openPopupAction.popup.multiPageMenuRenderer");
    const header = renderer.header;
    const account = (0, util_js_1.j)(header, "activeAccountHeaderRenderer");
    return {
        name: (0, util_js_1.j)(account, "accountName", nav_js_1.RUN_TEXT),
        thumbnails: (0, util_js_1.j)(account, "accountPhoto.thumbnails"),
        handle: (0, util_js_1.jo)(account, "channelHandle", nav_js_1.RUN_TEXT),
        channel_id: (0, util_js_1.j)(renderer, "sections.0.multiPageMenuSectionRenderer.items.0.compactLinkRenderer", nav_js_1.NAVIGATION_BROWSE_ID),
    };
}
