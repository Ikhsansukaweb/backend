import { get_continuations, get_validated_continuations, resend_request_until_valid, validate_response, } from "../continuations.js";
import { FEEDBACK_TOKEN, GRID, MENU_SERVICE, MRLIR, MTRIR, MUSIC_SHELF, NAVIGATION_BROWSE_ID, RUN_TEXT, SECTION_LIST, SECTION_LIST_CONTINUATION, SINGLE_COLUMN, SINGLE_COLUMN_TAB, TITLE, TITLE_TEXT, } from "../nav.js";
import { parse_album, parse_content_list, parse_mixed_item, parse_playlist, } from "../parsers/browsing.js";
import { fetch_library_contents, parse_library_artist, parse_library_songs, parse_toast, } from "../parsers/library.js";
import { parse_playlist_items, validate_playlist_id } from "../parsers/playlists.js";
import { j, jo } from "../util.js";
import { get_playlist } from "./playlist.js";
import { check_auth, prepare_library_sort_params, prepare_like_endpoint, prepare_order_params, randomString, validate_order_parameter, } from "./utils.js";
import { request, request_json } from "./_request.js";
export async function get_library_items(browseId, tab_index, options = {}) {
    const { order, limit = 20, continuation } = options;
    await check_auth();
    const endpoint = "browse";
    const data = {
        browseId,
    };
    const order_continuation = prepare_library_sort_params(order);
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
        const json = await request_json(endpoint, { data, signal: options.signal });
        let grid;
        if (order_continuation) {
            grid = j(json, SECTION_LIST_CONTINUATION, `[${tab_index.toString()}]`, GRID);
        }
        else {
            grid = j(json, SINGLE_COLUMN, "tabs", `[${tab_index.toString()}]`, "tabRenderer.content", SECTION_LIST, "[0]", GRID);
        }
        const results = j(grid, "items");
        library.results = results.map((result) => parse_mixed_item(j(result, MTRIR)));
        library.continuation = jo(grid, "continuations[0].nextContinuationData.continuation");
    }
    if (library.continuation) {
        const continued_data = await get_continuations(library.continuation, "gridContinuation", limit - library.results.length, (params) => {
            return request_json(endpoint, {
                data,
                params,
                signal: options.signal,
            });
        }, (contents) => {
            return contents.map((result) => parse_mixed_item(j(result, MTRIR)));
        });
        library.continuation = continued_data.continuation;
        library.results.push(...continued_data.items);
    }
    return library;
}
export function get_library_playlists(options) {
    return fetch_library_contents("FEmusic_liked_playlists", options, (playlists) => parse_content_list(playlists, (content) => {
        if (!content.subtitle)
            return null;
        return parse_playlist(content);
    }, MTRIR), true);
}
export function get_library(options = {}) {
    return get_library_items("FEmusic_library_landing", 0, options);
}
export async function get_library_songs(options = {}) {
    const { order, limit = 25, validate_responses = false, continuation } = options;
    await check_auth();
    const endpoint = "browse";
    const data = {
        browseId: "FEmusic_liked_videos",
    };
    const per_page = 25;
    validate_order_parameter(order);
    if (order) {
        data.params = prepare_order_params(order);
    }
    const request = (_params = {}) => request_json(endpoint, {
        data,
        signal: options.signal,
    });
    const parse = (response) => parse_library_songs(response);
    const library_songs = {
        items: [],
        continuation: continuation ?? null,
    };
    if (!continuation) {
        let response = null;
        if (validate_responses) {
            response = await resend_request_until_valid(request, {}, parse, (parsed) => validate_response(parsed, per_page, limit, 0), 3);
        }
        else {
            response = parse(await request());
        }
        library_songs.items = response.parsed ?? [];
        library_songs.continuation = response.results;
    }
    if (library_songs.continuation) {
        const request_continuations = (params) => request_json(endpoint, { data, params, signal: options.signal });
        const parse_continuations = (contents) => parse_playlist_items(contents);
        if (validate_responses) {
            const continued_data = await get_validated_continuations(library_songs.continuation, "musicShelfContinuation", limit - library_songs.items.length, per_page, request_continuations, parse_continuations);
            library_songs.continuation = continued_data.continuation;
            library_songs.items.push(...continued_data.items);
        }
        else {
            const remaining_limit = limit == null
                ? null
                : limit - library_songs.items.length;
            const continued_data = await get_continuations(library_songs.continuation, "musicShelfContinuation", remaining_limit, request_continuations, parse_continuations);
            library_songs.continuation = continued_data.continuation;
            library_songs.items.push(...continued_data.items);
        }
    }
    return library_songs;
}
export function get_library_albums(options) {
    return fetch_library_contents("FEmusic_liked_albums", options, (albums) => parse_content_list(albums, parse_album), true);
}
export function get_library_artists(options) {
    return fetch_library_contents("FEmusic_library_corpus_track_artists", options, (artists) => parse_content_list(artists, parse_library_artist, MRLIR), false);
}
export function get_library_subscriptions(options) {
    return fetch_library_contents("FEmusic_library_corpus_artists", options, (subs) => parse_content_list(subs, (sub) => parse_library_artist(sub, true), MRLIR), false);
}
export async function get_liked_songs(options) {
    await check_auth();
    return get_playlist("LM", options);
}
export function add_history_item(song, options = {}) {
    const url = typeof song === "string" ? song : song.videostatsPlaybackUrl;
    return request(url, {
        method: "get",
        params: {
            ver: "2",
            cpn: randomString(16),
            c: "WEB_REMIX",
        },
        signal: options.signal,
    });
}
export async function remove_history_items(feedbackTokens, options = {}) {
    await check_auth();
    const json = request_json("feedback", {
        data: { feedbackTokens },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function rate_song(videoId, status, options = {}) {
    await check_auth();
    const json = await request_json(prepare_like_endpoint(status), {
        data: {
            target: {
                videoId,
            },
        },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function edit_song_library_status(feedbackTokens, options = {}) {
    await check_auth();
    const json = await request_json("feedback", {
        data: { feedbackTokens },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function rate_playlist(playlistId, status, options = {}) {
    await check_auth();
    const json = await request_json(prepare_like_endpoint(status), {
        data: {
            target: {
                playlistId: validate_playlist_id(playlistId),
            },
        },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function subscribe_artists(channelIds, options = {}) {
    await check_auth();
    const json = await request_json("subscription/subscribe", {
        data: {
            channelIds,
        },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function unsubscribe_artists(channelIds, options = {}) {
    await check_auth();
    const json = await request_json("subscription/unsubscribe", {
        data: {
            channelIds,
        },
        signal: options.signal,
    });
    return parse_toast(json);
}
export async function get_history() {
    await check_auth();
    const json = await request_json("browse", {
        data: {
            browseId: "FEmusic_history",
        },
    });
    const results = j(json, SINGLE_COLUMN_TAB, SECTION_LIST);
    const history = {
        categories: [],
    };
    for (const content of results) {
        const data = jo(content, MUSIC_SHELF, "contents");
        if (!data) {
            // I'm not sure what this means...
            throw new Error(jo(content, "musicNotifierShelfRenderer", TITLE));
        }
        const songlist = parse_playlist_items(data, [[
                "-1:",
                MENU_SERVICE,
                FEEDBACK_TOKEN,
            ]]);
        const category = {
            title: j(content, MUSIC_SHELF, TITLE_TEXT),
            items: songlist,
        };
        history.categories.push(category);
    }
    return history;
}
export async function get_current_user(options = {}) {
    await check_auth();
    const json = await request_json("account/account_menu", {
        signal: options.signal,
    });
    const renderer = j(json, "actions.0.openPopupAction.popup.multiPageMenuRenderer");
    const header = renderer.header;
    const account = j(header, "activeAccountHeaderRenderer");
    return {
        name: j(account, "accountName", RUN_TEXT),
        thumbnails: j(account, "accountPhoto.thumbnails"),
        handle: jo(account, "channelHandle", RUN_TEXT),
        channel_id: j(renderer, "sections.0.multiPageMenuSectionRenderer.items.0.compactLinkRenderer", NAVIGATION_BROWSE_ID),
    };
}
