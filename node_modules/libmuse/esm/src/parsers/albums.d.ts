import { ArtistRun } from "../mod.js";
import { AlbumType } from "./browsing.js";
import { LikeStatus } from "./songs.js";
import { MenuPlaylists, Thumbnail } from "./util.js";
export interface AlbumHeader extends MenuPlaylists {
    title: string;
    album_type: AlbumType;
    thumbnails: Thumbnail[];
    isExplicit: boolean;
    description: string | null;
    trackCount: string | null;
    duration: string | null;
    audioPlaylistId: string | null;
    likeStatus: LikeStatus | null;
    artists: ArtistRun[];
    year: string | null;
}
export declare function parse_album_header(header: any): AlbumHeader;
//# sourceMappingURL=albums.d.ts.map