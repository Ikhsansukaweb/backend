"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_user_playlists = exports.get_user = exports.is_ranked = void 0;
exports.get_home = get_home;
exports.get_artist = get_artist;
exports.get_album = get_album;
exports.get_album_browse_id = get_album_browse_id;
exports.get_song = get_song;
exports.get_song_related = get_song_related;
exports.get_lyrics = get_lyrics;
exports.get_artist_albums = get_artist_albums;
exports.get_channel = get_channel;
exports.get_channel_playlists = get_channel_playlists;
const constants_ng_js_1 = __importDefault(require("../constants-ng.js"));
const continuations_js_1 = require("../continuations.js");
const nav_js_1 = require("../nav.js");
const albums_js_1 = require("../parsers/albums.js");
const browsing_js_1 = require("../parsers/browsing.js");
const playlists_js_1 = require("../parsers/playlists.js");
const songs_js_1 = require("../parsers/songs.js");
const util_js_1 = require("../util.js");
const utils_js_1 = require("./utils.js");
const _request_js_1 = require("./_request.js");
var browsing_js_2 = require("../parsers/browsing.js");
Object.defineProperty(exports, "is_ranked", { enumerable: true, get: function () { return browsing_js_2.is_ranked; } });
// TODO: get home thumbnails
async function get_home(options = {}) {
    const { params, limit = 3, continuation, signal } = options;
    const endpoint = "browse";
    const data = { browseId: "FEmusic_home" };
    if (params) {
        data.params = params;
    }
    const home = {
        continuation: null,
        results: [],
        moods: [],
        thumbnails: [],
    };
    let section_list;
    if (continuation) {
        home.continuation = continuation;
    }
    else {
        const json = await (0, _request_js_1.request_json)(endpoint, { data, signal });
        const tab = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB);
        const results = (0, util_js_1.j)(tab, nav_js_1.SECTION_LIST);
        section_list = (0, util_js_1.j)(tab, "sectionListRenderer");
        home.moods.push(...(0, browsing_js_1.parse_moods)(tab));
        home.continuation = (0, util_js_1.j)(section_list, "continuations[0].nextContinuationData.continuation");
        home.results = (0, browsing_js_1.parse_mixed_content)(results);
        home.thumbnails = (0, util_js_1.j)(json, "background", "musicThumbnailRenderer", nav_js_1.THUMBNAIL);
    }
    if (home.continuation) {
        const continued_data = await (0, continuations_js_1.get_continuations)(home.continuation, "sectionListContinuation", limit - home.results.length, (params) => {
            return (0, _request_js_1.request_json)(endpoint, {
                data,
                params,
                signal,
            });
        }, (contents) => {
            return (0, browsing_js_1.parse_mixed_content)(contents);
        });
        home.continuation = continued_data.continuation;
        home.results.push(...continued_data.items);
    }
    return home;
}
async function get_artist(artistId, options = {}) {
    if (artistId.startsWith("MPLA"))
        artistId = artistId.slice(4);
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId: artistId,
        },
        signal: options.signal,
    });
    const results = (0, util_js_1.j)(json, `${nav_js_1.SINGLE_COLUMN_TAB}.${nav_js_1.SECTION_LIST}`);
    const header = (0, util_js_1.j)(json, "header.musicImmersiveHeaderRenderer");
    const subscription_button = (0, util_js_1.j)(header, "subscriptionButton.subscribeButtonRenderer");
    const artist = {
        views: null,
        description: null,
        name: (0, util_js_1.j)(header, nav_js_1.TITLE_TEXT),
        channelId: (0, util_js_1.j)(subscription_button, "channelId"),
        shuffleId: (0, util_js_1.jo)(header, `playButton.buttonRenderer.${nav_js_1.NAVIGATION_PLAYLIST_ID}`),
        radioId: (0, util_js_1.jo)(header, `startRadioButton.buttonRenderer.${nav_js_1.NAVIGATION_PLAYLIST_ID}`),
        subscribers: (0, util_js_1.jo)(subscription_button, "subscriberCountText.runs[0].text"),
        subscribed: subscription_button.subscribed,
        thumbnails: (0, util_js_1.jo)(header, nav_js_1.THUMBNAILS),
        songs: { browseId: null, results: [] },
        ...(0, browsing_js_1.parse_artist_contents)(results),
    };
    const descriptionShelf = (0, nav_js_1.find_object_by_key)(results, nav_js_1.DESCRIPTION_SHELF, undefined, true);
    if (descriptionShelf) {
        artist.description = (0, util_js_1.j)(descriptionShelf, nav_js_1.DESCRIPTION);
        artist.views = !("subheader" in descriptionShelf)
            ? null
            : (0, util_js_1.j)(descriptionShelf, `subheader.runs[0].text`);
    }
    // API sometimes doesn't return the songs
    if ("musicShelfRenderer" in results[0]) {
        const musicShelf = (0, util_js_1.j)(results[0], `${nav_js_1.MUSIC_SHELF}`);
        if ("navigationEndpoint" in (0, util_js_1.j)(musicShelf, nav_js_1.TITLE)) {
            artist.songs.browseId = (0, util_js_1.j)(musicShelf, `${nav_js_1.TITLE}.${nav_js_1.NAVIGATION_BROWSE_ID}`);
        }
        artist.songs.results = (0, playlists_js_1.parse_playlist_items)(musicShelf.contents);
    }
    return artist;
}
async function get_album(browseId, options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId,
        },
        signal: options.signal,
    });
    const { tab, secondary } = (0, browsing_js_1.parse_two_columns)(json);
    const header = (0, albums_js_1.parse_album_header)((0, util_js_1.j)(tab, nav_js_1.SECTION_LIST_ITEM, nav_js_1.RESPONSIVE_HEADER));
    const results = (0, util_js_1.j)(secondary, nav_js_1.SECTION_LIST_ITEM, nav_js_1.MUSIC_SHELF);
    const carousel = (0, util_js_1.jo)(secondary, nav_js_1.SECTION_LIST, "1", nav_js_1.CAROUSEL);
    const album = {
        id: (0, browsing_js_1.find_context_param)(json, "browse_id"),
        ...header,
        tracks: (0, playlists_js_1.parse_playlist_items)(results.contents),
        other_versions: null,
        duration_seconds: 0,
    };
    if (carousel != null) {
        album.other_versions = (0, browsing_js_1.parse_content_list)(carousel.contents, browsing_js_1.parse_album);
    }
    album.duration_seconds = (0, util_js_1.sum_total_duration)(album);
    return album;
}
async function get_album_browse_id(audio_playlist_id, options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId: audio_playlist_id.startsWith("VL")
                ? audio_playlist_id
                : "VL" + audio_playlist_id,
        },
        signal: options.signal,
    });
    return (0, util_js_1.jo)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, "musicPlaylistShelfRenderer", nav_js_1.CONTENT, nav_js_1.MRLIR, "flexColumns[2]", nav_js_1.MRLITFC, "runs[0]", nav_js_1.NAVIGATION_BROWSE_ID);
}
async function get_song(video_id, options = {}) {
    const response = await (0, _request_js_1.request_json)("player", {
        data: {
            ...constants_ng_js_1.default.ANDROID.DATA,
            contentCheckOk: true,
            racyCheckOk: true,
            video_id,
        },
        signal: options.signal,
    });
    const song = {
        formats: response.streamingData.formats?.map(songs_js_1.parse_format) ?? [],
        adaptive_formats: response.streamingData.adaptiveFormats.map(songs_js_1.parse_format),
        expires: new Date(new Date().getTime() +
            (Number(response.streamingData.expiresInSeconds) * 1000)),
        videoDetails: {
            ...response.videoDetails,
            lengthSeconds: Number(response.videoDetails.lengthSeconds),
            viewCount: Number(response.videoDetails.viewCount),
        },
        playerConfig: response.playerConfig,
        playbackTracking: response.playbackTracking,
        videostatsPlaybackUrl: response.playbackTracking.videostatsPlaybackUrl.baseUrl,
        captions: (0, util_js_1.jo)(response, "captions.playerCaptionsTracklistRenderer.captionTracks")
            ?.map((caption) => ({
            url: caption.baseUrl,
            name: (0, util_js_1.j)(caption, "name.runs[0].text"),
            vssId: caption.vssId,
            lang: caption.languageCode,
            translatable: caption.isTranslatable,
        })) ?? [],
        hlsManifestUrl: response.streamingData.hlsManifestUrl,
        aspectRatio: response.videoDetails.aspectRatio,
        serverAbrStreamingUrl: response.streamingData.serverManifestStreamUrl,
    };
    return song;
}
async function get_song_related(browseId, options = {}) {
    if (!browseId)
        throw new Error("No browseId provided");
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId,
        },
        signal: options.signal,
    });
    const sections = (0, util_js_1.j)(json, "contents", nav_js_1.SECTION_LIST);
    return (0, browsing_js_1.parse_mixed_content)(sections);
}
async function get_lyrics(browseId, options = {}) {
    if (!browseId) {
        throw new TypeError("Invalid browseId provided. This song might not have lyrics.");
    }
    const json = await (0, _request_js_1.request_json)("browse", {
        data: { browseId, ...constants_ng_js_1.default.ANDROID.DATA },
        signal: options.signal,
    });
    const synced_data = (0, util_js_1.jo)(json, "contents.elementRenderer.newElement.type.componentType.model.timedLyricsModel.lyricsData");
    if (synced_data) {
        const lyrics = {
            timed: true,
            source: (0, util_js_1.jo)(synced_data, "sourceMessage"),
            lyrics: (0, util_js_1.jo)(synced_data, "timedLyricsData")
                ?.map((line) => {
                return line.lyricLine;
            })
                .map((line) => {
                if (line === "♪") {
                    return "\n";
                }
                return line;
            })
                .join("\n")
                .trim(),
            timed_lyrics: (0, util_js_1.jo)(synced_data, "timedLyricsData")
                ?.map((line) => {
                return {
                    line: line.lyricLine,
                    start: +line.cueRange.startTimeMilliseconds,
                    end: +line.cueRange.endTimeMilliseconds,
                    id: line.cueRange.metadata.id,
                };
            }) ?? [],
        };
        return lyrics;
    }
    else {
        const lyrics = {
            timed: false,
            lyrics: (0, util_js_1.jo)(json, "contents", nav_js_1.SECTION_LIST_ITEM, nav_js_1.DESCRIPTION_SHELF, nav_js_1.DESCRIPTION),
            source: (0, util_js_1.jo)(json, "contents", nav_js_1.SECTION_LIST_ITEM, nav_js_1.DESCRIPTION_SHELF, "footer", nav_js_1.RUN_TEXT),
        };
        return lyrics;
    }
}
async function get_artist_albums(channelId, params, options = {}) {
    const data = {
        browseId: channelId,
        params,
    };
    function get_chips(renderer) {
        const header = (0, util_js_1.j)(renderer, "header.musicSideAlignedItemRenderer");
        const chips = (0, util_js_1.j)(header, "startItems.0.chipCloudRenderer.chips");
        const selected_chip = (0, util_js_1.j)(chips
            .find((chip) => chip.chipCloudChipRenderer.isSelected == true), "chipCloudChipRenderer", nav_js_1.TEXT_RUN_TEXT);
        return {
            selected_chip: selected_chip,
            sort_options: (0, utils_js_1.get_sort_options)(header.endItems),
        };
    }
    if (options.continuation) {
        return (0, continuations_js_1.get_sort_continuations)(options.continuation, "sectionListContinuation", (params) => {
            return (0, _request_js_1.request_json)("browse", {
                data,
                params,
                signal: options.signal,
            });
        }, (contents, continuation) => {
            const chips = get_chips(continuation);
            return {
                artist: null,
                title: chips.selected_chip,
                results: (0, browsing_js_1.parse_content_list)((0, util_js_1.j)(contents[0], nav_js_1.GRID_ITEMS), browsing_js_1.parse_album),
                sort: chips.sort_options,
            };
        });
    }
    const json = await (0, _request_js_1.request_json)("browse", {
        data,
        signal: options.signal,
    });
    const columnTab = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB);
    const grid = (0, util_js_1.j)(columnTab, nav_js_1.SECTION_LIST_ITEM, nav_js_1.GRID);
    const chips = get_chips((0, util_js_1.j)(columnTab, "sectionListRenderer"));
    return {
        artist: (0, util_js_1.j)(json, "header.musicHeaderRenderer", nav_js_1.TITLE_TEXT),
        title: chips.selected_chip,
        results: (0, browsing_js_1.parse_content_list)(grid.items, browsing_js_1.parse_album),
        sort: chips.sort_options,
    };
}
async function get_channel(channelId, options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: { browseId: channelId },
        signal: options.signal,
    });
    const results = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST);
    const header = (0, util_js_1.j)(json, "header.musicVisualHeaderRenderer");
    const channel = {
        name: (0, util_js_1.j)(header, nav_js_1.TITLE_TEXT),
        channelId: (0, browsing_js_1.find_context_param)(json, "browse_id"),
        thumbnails: (0, util_js_1.jo)(header, "foregroundThumbnail.musicThumbnailRenderer", nav_js_1.THUMBNAIL),
        ...(0, browsing_js_1.parse_channel_contents)(results),
        songs_on_repeat: null,
    };
    if ("musicShelfRenderer" in results[0]) {
        const musicShelf = (0, util_js_1.j)(results[0], `${nav_js_1.MUSIC_SHELF}`);
        channel.songs_on_repeat = {
            results: (0, playlists_js_1.parse_playlist_items)(musicShelf.contents),
        };
    }
    return channel;
}
/**
 * @deprecated Use `get_channel` instead.
 */
exports.get_user = get_channel;
async function get_channel_playlists(channelId, params, options = {}) {
    const json = await (0, _request_js_1.request_json)("browse", {
        data: {
            browseId: channelId,
            params,
        },
        signal: options.signal,
    });
    const grid = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, nav_js_1.GRID);
    return {
        artist: (0, util_js_1.j)(json, "header.musicHeaderRenderer", nav_js_1.TITLE_TEXT),
        title: (0, util_js_1.j)(grid, "header.gridHeaderRenderer", nav_js_1.TITLE_TEXT),
        results: (0, browsing_js_1.parse_content_list)(grid.items, browsing_js_1.parse_playlist),
    };
}
/**
 * @deprecated Use `get_channel_playlists` instead.
 */
exports.get_user_playlists = get_channel_playlists;
