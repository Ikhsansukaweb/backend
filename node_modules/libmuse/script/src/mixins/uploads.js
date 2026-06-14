"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_library_upload_songs = get_library_upload_songs;
exports.get_library_upload_albums = get_library_upload_albums;
exports.get_library_upload_artists = get_library_upload_artists;
exports.get_library_uploads = get_library_uploads;
exports.get_library_upload_artist = get_library_upload_artist;
exports.get_library_upload_album = get_library_upload_album;
exports.upload_song = upload_song;
exports.delete_upload_entity = delete_upload_entity;
const continuations_js_1 = require("../continuations.js");
const deps_js_1 = require("../deps.js");
const errors_js_1 = require("../errors.js");
const nav_js_1 = require("../nav.js");
const albums_js_1 = require("../parsers/albums.js");
const browsing_js_1 = require("../parsers/browsing.js");
const library_js_1 = require("../parsers/library.js");
const uploads_js_1 = require("../parsers/uploads.js");
const util_js_1 = require("../util.js");
const _request_js_1 = require("./_request.js");
const library_js_2 = require("./library.js");
const utils_js_1 = require("./utils.js");
function get_library_upload_songs(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_library_privately_owned_tracks", options, uploads_js_1.parse_uploaded_items, false);
}
function get_library_upload_albums(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_library_privately_owned_releases", options, (albums) => (0, browsing_js_1.parse_content_list)(albums, browsing_js_1.parse_album, nav_js_1.MTRIR), true);
}
function get_library_upload_artists(options) {
    return (0, library_js_1.fetch_library_contents)("FEmusic_library_privately_owned_artists", options, (artists) => (0, browsing_js_1.parse_content_list)(artists, library_js_1.parse_library_artist), false);
}
function get_library_uploads(options = {}) {
    return (0, library_js_2.get_library_items)("FEmusic_library_privately_owned_landing", 1, options);
}
async function get_library_upload_artist(browseId, options = {}) {
    const { limit = 20, continuation } = options;
    await (0, utils_js_1.check_auth)();
    const data = { browseId };
    const endpoint = "browse";
    const artist = {
        name: null,
        items: [],
        continuation: null,
    };
    if (!continuation) {
        const json = await (0, _request_js_1.request_json)(endpoint, { data, signal: options.signal });
        const results = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, nav_js_1.MUSIC_SHELF);
        artist.name = (0, util_js_1.j)(json, "header.musicHeaderRenderer", nav_js_1.TITLE_TEXT);
        if (results.contents.length > 1) {
            results.contents.pop();
        }
        artist.items = (0, uploads_js_1.parse_uploaded_items)(results.contents);
        if ("continuations" in results) {
            artist.continuation = results;
        }
    }
    if (artist.continuation) {
        const continued_data = await (0, continuations_js_1.get_continuations)(artist.continuation, "musicShelfContinuation", limit - artist.items.length, (params) => (0, _request_js_1.request_json)(endpoint, { data, params, signal: options.signal }), (contents) => (0, uploads_js_1.parse_uploaded_items)(contents));
        artist.items.push(...continued_data.items);
        artist.continuation = continued_data.continuation;
    }
    return artist;
}
async function get_library_upload_album(browseId, options = {}) {
    await (0, utils_js_1.check_auth)();
    const data = { browseId };
    const endpoint = "browse";
    const json = await (0, _request_js_1.request_json)(endpoint, { data, signal: options.signal });
    const results = (0, util_js_1.j)(json, nav_js_1.SINGLE_COLUMN_TAB, nav_js_1.SECTION_LIST_ITEM, nav_js_1.MUSIC_SHELF);
    const album = {
        ...(0, albums_js_1.parse_album_header)(json),
        tracks: (0, uploads_js_1.parse_uploaded_items)(results.contents),
    };
    album.duration_seconds = (0, util_js_1.sum_total_duration)(album);
    return album;
}
/**
 * Upload song won't work yet, as the TV client can't do uploads
 */
async function upload_song(filename, contents, options = {}) {
    await (0, utils_js_1.check_auth)();
    // check for file type
    const supported_file_types = ["mp3", "m4a", "wma", "flac", "ogg"];
    if (!supported_file_types.includes((0, deps_js_1.extname)(filename).slice(1))) {
        throw new errors_js_1.MuseError(errors_js_1.ERROR_CODE.UPLOADS_INVALID_FILETYPE, "Unsupported file type");
    }
    const get_upload_url = "https://upload.youtube.com/upload/usermusic/http";
    const filesize = contents.byteLength;
    const encoder = new TextEncoder();
    const get_response = await (0, _request_js_1.request)(get_upload_url, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": filesize.toString(),
            "X-Goog-Upload-Protocol": "resumable",
        },
        raw_data: true,
        data: encoder.encode("filename=" + (0, deps_js_1.basename)(filename)),
        signal: options.signal,
    });
    const upload_url = get_response.headers.get("X-Goog-Upload-URL");
    const response = await (0, _request_js_1.request)(upload_url, {
        data: contents,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "X-Goog-Upload-Command": "upload, finalize",
            "X-Goog-Upload-Offset": "0",
        },
        raw_data: true,
        signal: options.signal,
    });
    return response;
}
async function delete_upload_entity(entityId, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = await (0, _request_js_1.request_json)("music/delete_privately_owned_entity", {
        data: {
            entityId: entityId.startsWith("FEmusic_library_privately_owned_release_detail")
                ? entityId.slice(47)
                : entityId,
        },
        signal: options.signal,
    });
    return json;
}
