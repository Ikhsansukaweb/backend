import { TrendChange } from "./browsing.js";
import { Album, LikeStatus, MenuTokens, SongArtist } from "./songs.js";
import { Thumbnail } from "./util.js";
export type VideoType = "MUSIC_VIDEO_TYPE_OMV" /** Official Music Videos */ | "MUSIC_VIDEO_TYPE_UGC" /** User Generated Content */ | "MUSIC_VIDEO_TYPE_ATV" /** Artist Videos */ | "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK" /** Song uploaded by user */;
export interface PlaylistItem {
    videoId: string;
    title: string;
    artists: SongArtist[];
    album: Album | null;
    likeStatus: LikeStatus;
    thumbnails: Thumbnail[];
    isAvailable: boolean;
    isExplicit: boolean;
    videoType: VideoType;
    duration: string | null;
    duration_seconds: number | null;
    setVideoId: string | null;
    feedbackTokens: MenuTokens | null;
    feedbackToken: null;
    rank: string | null;
    change: TrendChange | null;
}
export declare const parse_playlist_items: (results: any, menu_entries?: string[][] | null) => PlaylistItem[];
export declare function validate_playlist_id(playlistId: string): string;
//# sourceMappingURL=playlists.d.ts.map