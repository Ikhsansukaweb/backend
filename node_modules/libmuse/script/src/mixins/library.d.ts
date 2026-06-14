import { MixedItem, ParsedPlaylist } from "../parsers/browsing.js";
import { ParsedLibraryArtist } from "../parsers/library.js";
import { PlaylistItem } from "../parsers/playlists.js";
import { LikeStatus } from "../parsers/songs.js";
import { ParsedAlbum, Song, Thumbnail } from "./browsing.js";
import { GetPlaylistOptions, Playlist } from "./playlist.js";
import { AbortOptions, LibraryOrder, PaginationAndOrderOptions, PaginationOptions } from "./utils.js";
export type { ParsedLibraryArtist } from "../parsers/library.js";
export interface GetLibraryOptions extends PaginationOptions {
    order?: LibraryOrder;
}
export interface Library {
    continuation: string | null;
    results: MixedItem[];
}
export declare function get_library_items(browseId: string, tab_index: number, options?: GetLibraryOptions): Promise<Library>;
export interface LibraryPlaylists {
    playlists: ParsedPlaylist[];
    continuation: string | null;
}
export declare function get_library_playlists(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedPlaylist>>;
export declare function get_library(options?: GetLibraryOptions): Promise<Library>;
export interface GetLibrarySongOptions extends PaginationAndOrderOptions {
    validate_responses?: boolean;
}
export interface LibrarySongs {
    items: PlaylistItem[];
    continuation: string | null;
}
export declare function get_library_songs(options?: GetLibrarySongOptions): Promise<LibrarySongs>;
export interface LibraryItems<T extends any> {
    continuation: string | null;
    items: T[];
}
export declare function get_library_albums(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedAlbum>>;
export declare function get_library_artists(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedLibraryArtist>>;
export declare function get_library_subscriptions(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedLibraryArtist>>;
export declare function get_liked_songs(options?: GetPlaylistOptions): Promise<Playlist>;
export declare function add_history_item(song: Song | string, options?: AbortOptions): Promise<Response>;
export declare function remove_history_items(feedbackTokens: string[], options?: AbortOptions): Promise<string | null>;
export declare function rate_song(videoId: string, status: LikeStatus, options?: AbortOptions): Promise<string | null>;
export declare function edit_song_library_status(feedbackTokens: string[], options?: AbortOptions): Promise<string | null>;
export declare function rate_playlist(playlistId: string, status: LikeStatus, options?: AbortOptions): Promise<string | null>;
export declare function subscribe_artists(channelIds: string[], options?: AbortOptions): Promise<string | null>;
export declare function unsubscribe_artists(channelIds: string[], options?: AbortOptions): Promise<string | null>;
export interface History {
    categories: {
        title: string;
        items: PlaylistItem[];
    }[];
}
export declare function get_history(): Promise<History>;
export interface User {
    name: string;
    thumbnails: Thumbnail[];
    handle: string | null;
    channel_id: string;
}
export declare function get_current_user(options?: AbortOptions): Promise<User>;
//# sourceMappingURL=library.d.ts.map