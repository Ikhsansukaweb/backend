import { PaginationAndOrderOptions } from "../mixins/utils.js";
import { MenuPlaylists, Thumbnail } from "./util.js";
export interface ParsedLibraryArtist extends MenuPlaylists {
    type: "library-artist";
    browseId: string;
    name: string;
    songs: string | null;
    subscribers: string | null;
    thumbnails: Thumbnail[];
}
export declare function parse_library_artist(data: any, has_subscribers?: boolean): ParsedLibraryArtist;
export declare function fetch_library_contents<T extends any>(browseId: string, options: PaginationAndOrderOptions | undefined, parse: (results: any) => T[], grid: boolean): Promise<{
    items: T[];
    continuation: string | null;
}>;
export declare function parse_library_songs(response: any): {
    results: any;
    parsed: import("./playlists.js").PlaylistItem[] | null;
};
/**
 * Find library contents. This function is a bit messy now
 * as it is supporting two different response types. Can be
 * cleaned up once all users are migrated to the new responses.
 */
export declare function get_library_contents(response: string, renderer: string): any;
export declare function parse_toast(json: any): string | null;
//# sourceMappingURL=library.d.ts.map