import { get_continuations } from "../continuations.js";
import { NAVIGATION_BROWSE_ID, TAB_CONTENT, TEXT_RUN_TEXT } from "../nav.js";
import { validate_playlist_id } from "../parsers/playlists.js";
import { get_tab_browse_id, parse_queue_playlist, } from "../parsers/queue.js";
import { j, jo } from "../util.js";
import { request_json } from "./_request.js";
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
export async function get_queue(videoId, playlistId, options = {}) {
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
    data.playlistId = playlistId ? validate_playlist_id(playlistId) : undefined;
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
        const json = await request_json(endpoint, { data, signal });
        const currentWatch = json.currentVideoEndpoint.watchEndpoint;
        queue.current = {
            videoId: currentWatch.videoId,
            playlistId: currentWatch.playlistId,
            index: currentWatch.index,
        };
        const watchNextRenderer = j(json, "contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer");
        queue.lyrics = get_tab_browse_id(watchNextRenderer, 1);
        queue.related = get_tab_browse_id(watchNextRenderer, 2);
        const renderer = j(watchNextRenderer, TAB_CONTENT, "musicQueueRenderer");
        const results = j(renderer, "content.playlistPanelRenderer");
        queue.playlist = queue.playlistName = jo(results, "title");
        queue.playlistId = jo(results, "playlistId");
        queue.author = {
            name: jo(results, "longBylineText.runs[0].text"),
            id: jo(results, "longBylineText.runs[0]", NAVIGATION_BROWSE_ID),
        };
        queue.tracks.push(...parse_queue_playlist(results.contents));
        const chipRenderers = jo(renderer, "subHeaderChipCloud.chipCloudRenderer.chips");
        if (chipRenderers) {
            for (const chip of chipRenderers) {
                const endpoint = j(chip, "chipCloudChipRenderer.navigationEndpoint.queueUpdateCommand.fetchContentsCommand.watchEndpoint");
                const data = {
                    title: j(chip, "chipCloudChipRenderer", TEXT_RUN_TEXT),
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
        const continued_data = await get_continuations(continuation, "playlistPanelContinuation", limit - queue.tracks.length, async (params) => {
            const response = await request_json(endpoint, { data, params, signal });
            if (!("continuationContents" in response)) {
                const data = jo(response, "contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer", TAB_CONTENT, "musicQueueRenderer", "content.playlistPanelRenderer");
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
            return parse_queue_playlist(contents);
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
export async function get_queue_tracks(videoIds, options = {}) {
    if (videoIds.length === 0)
        return [];
    const response = await request_json("music/get_queue", {
        data: {
            videoIds,
        },
        signal: options.signal,
    });
    return parse_queue_playlist(response.queueDatas.map((data) => data.content));
}
/**
 * @function
 * @deprecated use `get_queue_tracks`
 */
export const get_queue_ids = get_queue_tracks;
