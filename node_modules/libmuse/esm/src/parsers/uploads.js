import { MENU_ITEMS, MENU_LIKE_STATUS, MENU_SERVICE, MRLIR, THUMBNAILS, } from "../nav.js";
import { j } from "../util.js";
import { parse_song_album, parse_song_artists, } from "./songs.js";
import { get_fixed_column_item, get_item_text, parse_duration, } from "./util.js";
export function parse_uploaded_items(results) {
    const songs = [];
    for (const result of results) {
        const data = result[MRLIR];
        if (!("menu" in data)) {
            continue;
        }
        const menu_items = j(data, MENU_ITEMS);
        const entityId = j(menu_items[menu_items.length - 1], "menuNavigationItemRenderer.navigationEndpoint.confirmDialogEndpoint.content.confirmDialogRenderer.confirmButton.buttonRenderer.command.musicDeletePrivatelyOwnedEntityCommand.entityId");
        const videoId = j(menu_items[0], MENU_SERVICE, "queueAddEndpoint.queueTarget.videoId");
        const title = get_item_text(data, 0);
        const like = j(data, MENU_LIKE_STATUS);
        const thumbnails = "thumbnail" in data ? j(data, THUMBNAILS) : null;
        const duration = get_fixed_column_item(data, 0).text.runs[0].text;
        songs.push({
            entityId,
            videoId,
            title,
            duration,
            duration_seconds: parse_duration(duration),
            artists: parse_song_artists(data, 1),
            album: parse_song_album(data, 2),
            likeStatus: like,
            thumbnails,
        });
    }
    return songs;
}
