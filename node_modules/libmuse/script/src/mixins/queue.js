"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_queue_ids = void 0;
exports.get_queue = get_queue;
exports.get_queue_tracks = get_queue_tracks;
const continuations_js_1 = require("../continuations.js");
const nav_js_1 = require("../nav.js");
const playlists_js_1 = require("../parsers/playlists.js");
const queue_js_1 = require("../parsers/queue.js");
const util_js_1 = require("../util.js");
const _request_js_1 = require("./_request.js");
/**
 * Gets a "queue" or "watch playlist" for a track or playlist
 *
 * This function returns all the information required to create a queue from a
 * singular track or a playlist
 * @param videoId the track ID to create a queue for
 *
 * If `playlistId` is also specified, this should be a track within the given
 * playlist.
 * @param playlistId the playlist ID to create a queue for
 * @param options
 * @returns
 */
async function get_queue(videoId, playlistId, options = {}) {
    const { limit = 10, continuation: _continuation = null, radio = false, shuffle = false, autoplay = false, params, signal, } = options;
    let continuation = _continuation;
    const endpoint = "next";
    const data = {
        enablePersistentPlaylistPanel: true,
        isAudioOnly: true,
        tunerSettingValue: "AUTOMIX_SETTING_NORMAL",
        params: params ?? undefined,
    };
    if (!videoId && !playlistId) {
        throw new Error("Must provide videoId or playlistId or both");
    }
    if (videoId != null) {
        data.videoId = videoId;
        if (radio && !playlistId) {
            playlistId = "RDAMVM" + videoId;
        }
        if (!(radio || shuffle)) {
            data.watchEndpointMusicSupportedConfigs = {
                watchEndpointMusicConfig: {
                    musicVideoType: "MUSIC_VIDEO_TYPE_ATV",
                    hasPersistentPlaylistPanel: true,
                },
            };
        }
    }
    data.playlistId = playlistId ? (0, playlists_js_1.validate_playlist_id)(playlistId) : undefined;
    if (videoId && playlistId) {
        data.params = "8gEAmgMDCNgE";
    }
    if (shuffle && playlistId) {
        data.params = "wAEB8gECKAE%3D";
    }
    if (radio) {
        data.params = "wAEB";
    }
    if (autoplay) {
        if (data.playlistId) {
            if (!params) {
                // if (videoId) {
                //   data.params = "OAHyAQQIAXgB";
                if (data.playlistId.startsWith("RDAT")) {
                    data.params = "8gECeAE%3D";
                }
                else {
                    data.params = "wAEB8gECeAE%3D";
                }
            }
            // RDAMPL is for the radio of any playlist
            // RDAT is for a specific radio of a playlist (All, R&B, Familiar etc...)
            if (!data.playlistId.startsWith("RDAMPL") &&
                !data.playlistId.startsWith("RDAT")) {
                data.playlistId = "RDAMPL" + data.playlistId;
            }
        }
        else {
            throw new Error("Can't autoplay without a playlistId");
        }
    }
    const is_playlist = playlistId && data.playlistId.match(/^(PL|OLA|RD)/)
        ? true
        : false;
    const queue = {
        chips: [],
        playlist: null,
        playlistId: null,
        playlistName: null,
        tracks: [],
        lyrics: null,
        related: null,
        author: null,
        continuation: null,
        current: null,
    };
    if (!continuation) {
        const json = await (0, _request_js_1.request_json)(endpoint, { data, signal });
        const currentWatch = json.currentVideoEndpoint.watchEndpoint;
        queue.current = {
            videoId: currentWatch.videoId,
            playlistId: currentWatch.playlistId,
            index: currentWatch.index,
        };
        const watchNextRenderer = (0, util_js_1.j)(json, "contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer");
        queue.lyrics = (0, queue_js_1.get_tab_browse_id)(watchNextRenderer, 1);
        queue.related = (0, queue_js_1.get_tab_browse_id)(watchNextRenderer, 2);
        const renderer = (0, util_js_1.j)(watchNextRenderer, nav_js_1.TAB_CONTENT, "musicQueueRenderer");
        const results = (0, util_js_1.j)(renderer, "content.playlistPanelRenderer");
        queue.playlist = queue.playlistName = (0, util_js_1.jo)(results, "title");
        queue.playlistId = (0, util_js_1.jo)(results, "playlistId");
        queue.author = {
            name: (0, util_js_1.jo)(results, "longBylineText.runs[0].text"),
            id: (0, util_js_1.jo)(results, "longBylineText.runs[0]", nav_js_1.NAVIGATION_BROWSE_ID),
        };
        queue.tracks.push(...(0, queue_js_1.parse_queue_playlist)(results.contents));
        const chipRenderers = (0, util_js_1.jo)(renderer, "subHeaderChipCloud.chipCloudRenderer.chips");
        if (chipRenderers) {
            for (const chip of chipRenderers) {
                const endpoint = (0, util_js_1.j)(chip, "chipCloudChipRenderer.navigationEndpoint.queueUpdateCommand.fetchContentsCommand.watchEndpoint");
                const data = {
                    title: (0, util_js_1.j)(chip, "chipCloudChipRenderer", nav_js_1.TEXT_RUN_TEXT),
                    playlistId: endpoint.playlistId,
                    params: endpoint.params,
                };
                queue.chips.push(data);
            }
        }
        if ("continuations" in results) {
            continuation = results;
        }
    }
    if (continuation) {
        const continued_data = await (0, continuations_js_1.get_continuations)(continuation, "playlistPanelContinuation", limit - queue.tracks.length, async (params) => {
            const response = await (0, _request_js_1.request_json)(endpoint, { data, params, signal });
            if (!("continuationContents" in response)) {
                const data = (0, util_js_1.jo)(response, "contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer", nav_js_1.TAB_CONTENT, "musicQueueRenderer", "content.playlistPanelRenderer");
                if (data) {
                    return {
                        continuationContents: {
                            playlistPanelContinuation: data,
                        },
                    };
                }
            }
            else {
                return response;
            }
        }, (contents) => {
            return (0, queue_js_1.parse_queue_playlist)(contents);
        }, is_playlist ? "Radio" : "");
        queue.tracks.push(...continued_data.items);
        continuation = continued_data.continuation;
    }
    queue.continuation = typeof continuation === "string" ? continuation : null;
    return queue;
}
/**
 * Gets the QueueTrack metadata for the specified `videoId`s
 * @param videoIds track IDs to look queues for
 * @param options
 * @returns a list of QueueTracks for each videoId
 */
async function get_queue_tracks(videoIds, options = {}) {
    if (videoIds.length === 0)
        return [];
    const response = await (0, _request_js_1.request_json)("music/get_queue", {
        data: {
            videoIds,
        },
        signal: options.signal,
    });
    return (0, queue_js_1.parse_queue_playlist)(response.queueDatas.map((data) => data.content));
}
/**
 * @function
 * @deprecated use `get_queue_tracks`
 */
exports.get_queue_ids = get_queue_tracks;
