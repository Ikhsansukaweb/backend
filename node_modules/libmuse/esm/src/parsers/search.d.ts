import { AlbumType } from "./browsing.js";
import { ArtistRun, LikeStatus, MenuTokens, ShuffleAndRadioIds, SongRuns } from "./songs.js";
import { MenuPlaylists, Thumbnail } from "./util.js";
export declare const filters: readonly ["albums", "artists", "playlists", "community_playlists", "featured_playlists", "songs", "videos", "profiles"];
export type Filter = typeof filters[number];
export declare const scopes: readonly ["library", "uploads"];
export type Scope = typeof scopes[number];
export declare function get_search_params(filter: (Filter | null) | undefined, scope: (Scope | null) | undefined, autocorrect: boolean): string | null;
export declare function _get_param2(filter: Filter): "g" | "I" | "Q" | "Y" | "o" | "Dg" | "EA";
export interface SearchAlbum extends ShuffleAndRadioIds {
    type: "album";
    title: string;
    browseId: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
    album_type: AlbumType;
    year: string | null;
    artists: ArtistRun[];
}
export declare function parse_search_album(result: any): SearchAlbum;
export interface SearchSongOrVideo extends SongRuns {
    type: "song" | "video";
    title: string;
    videoId: string;
    playlistId: string | null;
    thumbnails: Thumbnail[];
    isExplicit: boolean;
    feedbackTokens: MenuTokens | null;
    videoType: string;
    likeStatus: LikeStatus | null;
}
export interface SearchSong extends SearchSongOrVideo {
    type: "song";
}
export declare function parse_search_song(result: any, has_label?: boolean): SearchSong;
export interface SearchVideo extends SearchSongOrVideo {
    type: "video";
}
export declare function parse_search_video(result: any, has_label?: boolean): SearchVideo;
export type SearchArtist = MenuPlaylists & ShuffleAndRadioIds & {
    type: "artist";
    name: string;
    subscribers: string | null;
    browseId: string;
    thumbnails: Thumbnail[];
};
export declare function parse_search_artist(result: any): SearchArtist;
export interface SearchProfile {
    type: "profile";
    name: string;
    username: string | null;
    browseId: string;
    thumbnails: Thumbnail[];
}
export declare function parse_search_profile(result: any): SearchProfile;
export interface SearchPlaylist extends ShuffleAndRadioIds {
    type: "playlist";
    title: string;
    songs: string | null;
    authors: ArtistRun[];
    browseId: string;
    thumbnails: Thumbnail[];
    libraryLikeStatus: LikeStatus | null;
}
export declare function parse_search_playlist(result: any, has_label?: boolean): SearchPlaylist;
export interface SearchRadio {
    type: "radio";
    title: string;
    videoId: string;
    playlistId: string;
    thumbnails: Thumbnail[];
}
export declare function parse_search_radio(result: any): SearchRadio;
export type SearchContent = SearchAlbum | SearchSong | SearchVideo | SearchArtist | SearchPlaylist | SearchRadio | SearchProfile;
export declare function parse_search_content(result: any, upload?: boolean, passed_entity?: string): SearchContent | null;
export declare function parse_search_results(results: any[], scope: Scope | null, filter: Filter | null): SearchContent[];
export declare function parse_top_result_more(result: any): SearchContent[];
export interface TopResultArtist extends SearchArtist {
    more: SearchContent[];
}
export declare function parse_top_result_artist(result: any): TopResultArtist;
export interface TopResultSong extends SearchSong {
    more: SearchContent[];
}
export interface TopResultVideo extends SearchVideo {
    more: SearchContent[];
}
export declare function parse_top_result_song(result: any): TopResultSong | TopResultVideo;
export interface TopResultAlbum extends SearchAlbum {
    more: SearchContent[];
}
export declare function parse_top_result_album(result: any): TopResultAlbum;
export interface TopResultPlaylist extends SearchPlaylist {
    description: string | null;
    shuffleId: string | null;
    more: SearchContent[];
}
export declare function parse_top_result_playlist(result: any): TopResultPlaylist;
export type TopResult = TopResultSong | TopResultAlbum | TopResultArtist | TopResultVideo | TopResultPlaylist;
export declare function parse_top_result(result: any): TopResultArtist | TopResultSong | TopResultVideo | TopResultAlbum | TopResultPlaylist | null;
//# sourceMappingURL=search.d.ts.map