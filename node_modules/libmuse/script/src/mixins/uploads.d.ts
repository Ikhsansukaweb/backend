import { AlbumHeader } from "../parsers/albums.js";
import { ParsedLibraryArtist } from "../parsers/library.js";
import { UploadedItem } from "../parsers/uploads.js";
import { ParsedAlbum } from "./browsing.js";
import { GetLibraryOptions, Library, LibraryItems } from "./library.js";
import { AbortOptions, PaginationAndOrderOptions, PaginationOptions } from "./utils.js";
export declare function get_library_upload_songs(options?: PaginationAndOrderOptions): Promise<LibraryItems<UploadedItem>>;
export declare function get_library_upload_albums(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedAlbum>>;
export declare function get_library_upload_artists(options?: PaginationAndOrderOptions): Promise<LibraryItems<ParsedLibraryArtist>>;
export declare function get_library_uploads(options?: GetLibraryOptions): Promise<Library>;
export interface LibraryUploadArtist {
    name: string | null;
    items: UploadedItem[];
    continuation: string | null;
}
export declare function get_library_upload_artist(browseId: string, options?: PaginationOptions): Promise<LibraryUploadArtist>;
export interface LibraryUploadAlbum extends AlbumHeader {
    tracks: UploadedItem[];
}
export declare function get_library_upload_album(browseId: string, options?: AbortOptions): Promise<LibraryUploadAlbum>;
/**
 * Upload song won't work yet, as the TV client can't do uploads
 */
export declare function upload_song(filename: string, contents: Uint8Array, options?: AbortOptions): Promise<Response>;
export declare function delete_upload_entity(entityId: string, options?: AbortOptions): Promise<any>;
//# sourceMappingURL=uploads.d.ts.map