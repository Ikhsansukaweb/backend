import { get_continuations } from "../continuations.js";
import { basename, extname } from "../deps.js";
import { ERROR_CODE, MuseError } from "../errors.js";
import { MTRIR, MUSIC_SHELF, SECTION_LIST_ITEM, SINGLE_COLUMN_TAB, TITLE_TEXT, } from "../nav.js";
import { parse_album_header } from "../parsers/albums.js";
import { parse_album, parse_content_list } from "../parsers/browsing.js";
import { fetch_library_contents, parse_library_artist, } from "../parsers/library.js";
import { parse_uploaded_items } from "../parsers/uploads.js";
import { j, sum_total_duration } from "../util.js";
import { request, request_json } from "./_request.js";
import { get_library_items, } from "./library.js";
import { check_auth, } from "./utils.js";
export function get_library_upload_songs(options) {
    return fetch_library_contents("FEmusic_library_privately_owned_tracks", options, parse_uploaded_items, false);
}
export function get_library_upload_albums(options) {
    return fetch_library_contents("FEmusic_library_privately_owned_releases", options, (albums) => parse_content_list(albums, parse_album, MTRIR), true);
}
export function get_library_upload_artists(options) {
    return fetch_library_contents("FEmusic_library_privately_owned_artists", options, (artists) => parse_content_list(artists, parse_library_artist), false);
}
export function get_library_uploads(options = {}) {
    return get_library_items("FEmusic_library_privately_owned_landing", 1, options);
}
export async function get_library_upload_artist(browseId, options = {}) {
    const { limit = 20, continuation } = options;
    await check_auth();
    const data = { browseId };
    const endpoint = "browse";
    const artist = {
        name: null,
        items: [],
        continuation: null,
    };
    if (!continuation) {
        const json = await request_json(endpoint, { data, signal: options.signal });
        const results = j(json, SINGLE_COLUMN_TAB, SECTION_LIST_ITEM, MUSIC_SHELF);
        artist.name = j(json, "header.musicHeaderRenderer", TITLE_TEXT);
        if (results.contents.length > 1) {
            results.contents.pop();
        }
        artist.items = parse_uploaded_items(results.contents);
        if ("continuations" in results) {
            artist.continuation = results;
        }
    }
    if (artist.continuation) {
        const continued_data = await get_continuations(artist.continuation, "musicShelfContinuation", limit - artist.items.length, (params) => request_json(endpoint, { data, params, signal: options.signal }), (contents) => parse_uploaded_items(contents));
        artist.items.push(...continued_data.items);
        artist.continuation = continued_data.continuation;
    }
    return artist;
}
export async function get_library_upload_album(browseId, options = {}) {
    await check_auth();
    const data = { browseId };
    const endpoint = "browse";
    const json = await request_json(endpoint, { data, signal: options.signal });
    const results = j(json, SINGLE_COLUMN_TAB, SECTION_LIST_ITEM, MUSIC_SHELF);
    const album = {
        ...parse_album_header(json),
        tracks: parse_uploaded_items(results.contents),
    };
    album.duration_seconds = sum_total_duration(album);
    return album;
}
/**
 * Upload song won't work yet, as the TV client can't do uploads
 */
export async function upload_song(filename, contents, options = {}) {
    await check_auth();
    // check for file type
    const supported_file_types = ["mp3", "m4a", "wma", "flac", "ogg"];
    if (!supported_file_types.includes(extname(filename).slice(1))) {
        throw new MuseError(ERROR_CODE.UPLOADS_INVALID_FILETYPE, "Unsupported file type");
    }
    const get_upload_url = "https://upload.youtube.com/upload/usermusic/http";
    const filesize = contents.byteLength;
    const encoder = new TextEncoder();
    const get_response = await request(get_upload_url, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": filesize.toString(),
            "X-Goog-Upload-Protocol": "resumable",
        },
        raw_data: true,
        data: encoder.encode("filename=" + basename(filename)),
        signal: options.signal,
    });
    const upload_url = get_response.headers.get("X-Goog-Upload-URL");
    const response = await request(upload_url, {
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
export async function delete_upload_entity(entityId, options = {}) {
    await check_auth();
    const json = await request_json("music/delete_privately_owned_entity", {
        data: {
            entityId: entityId.startsWith("FEmusic_library_privately_owned_release_detail")
                ? entityId.slice(47)
                : entityId,
        },
        signal: options.signal,
    });
    return json;
}
