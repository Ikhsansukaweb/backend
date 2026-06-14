import STRINGS from "../../locales/strings.js";
import { LikeStatus } from "../mod.js";
import { ArtistRun, MenuTokens, ShuffleAndRadioIds, SongArtist, SongRuns } from "./songs.js";
import { Thumbnail } from "./util.js";
export interface Mood {
    name: string;
    selected: boolean;
    params: string;
}
export declare function parse_moods(results: any[]): Mood[];
export type MixedItem = WatchPlaylist | ParsedSong | ParsedVideo | ParsedAlbum | RelatedArtist | FlatSong | ParsedPlaylist | null;
export declare function parse_mixed_item(data: any): WatchPlaylist | ParsedSong | ParsedAlbum | RelatedArtist | ParsedPlaylist | null;
export interface MixedContent {
    title: string | null;
    subtitle: string | null;
    thumbnails: Thumbnail[] | null;
    browseId: string | null;
    contents: string | MixedItem[];
    display: "list" | null;
}
export declare function parse_mixed_content(rows: any[]): MixedContent[];
export type CategoryMap = Record<string, [string, (a: any) => any, string?]>;
export type Category<Return> = {
    browseId: string | null;
    params: string | null;
    results: Return[];
};
export declare function parse_categories<Map extends CategoryMap>(results: any[], categories_data: Map): { [Key in keyof Map]: Category<ReturnType<Map[Key][1]>>; };
export declare function parse_channel_contents(results: any[]): {
    artists_on_repeat: Category<RelatedArtist>;
    playlists_on_repeat: Category<ParsedPlaylist>;
    videos: Category<ParsedVideo>;
    playlists: Category<ParsedPlaylist>;
};
export type NonNUllableChannelContents = ReturnType<typeof parse_channel_contents>;
export type ChannelContents = {
    [Key in keyof NonNUllableChannelContents]: NonNUllableChannelContents[Key] | null;
};
export declare function parse_artist_contents(results: any[]): {
    albums: Category<ParsedAlbum>;
    singles: Category<ParsedAlbum>;
    videos: Category<ParsedVideo>;
    playlists: Category<ParsedPlaylist>;
    related: Category<RelatedArtist>;
    featured: Category<ParsedPlaylist>;
    library: Category<WatchPlaylist | ParsedSong | ParsedAlbum | RelatedArtist | ParsedPlaylist | null>;
};
export type ArtistContents = ReturnType<typeof parse_artist_contents>;
export declare function parse_explore_contents(results: any[]): {
    albums: Category<ParsedAlbum>;
    songs: Category<Ranked<ParsedSong>>;
    moods: Category<ParsedMoodOrGenre>;
    trending: Category<Ranked<ParsedSong> | Ranked<ParsedVideo>>;
    videos: Category<Ranked<ParsedVideo>>;
};
export type ExploreContents = ReturnType<typeof parse_explore_contents>;
export declare function parse_chart_contents(results: any[]): {
    songs: Category<Ranked<ParsedSong> | Ranked<ParsedVideo>>;
    videos: Category<Ranked<ParsedVideo>>;
    genres: Category<ParsedPlaylist>;
    artists: Category<Ranked<RelatedArtist>>;
    trending: Category<Ranked<ParsedSong> | Ranked<ParsedVideo>>;
};
export type ChartContents = ReturnType<typeof parse_chart_contents>;
export declare function parse_content_list<T extends any>(results: any, parse_func: (data: any) => T | null, key?: string): T[];
export interface ParsedMoodOrGenre {
    title: string;
    color: string;
    params: string;
}
export declare function parse_mood_or_genre(result: any[]): ParsedMoodOrGenre;
export type AlbumType = "album" | "single" | "ep";
export interface ParsedAlbum extends ShuffleAndRadioIds {
    type: "album";
    title: string;
    year: string | null;
    browseId: string;
    audioPlaylistId: string;
    thumbnails: Thumbnail[];
    isExplicit: boolean;
    album_type: AlbumType | null;
    artists: ArtistRun[];
    libraryLikeStatus: LikeStatus | null;
}
export declare function parse_album(result: any): ParsedAlbum;
export declare function parse_single(result: any): ParsedAlbum;
export interface ParsedSong extends SongRuns {
    type: "inline-video" | "song";
    title: string;
    videoId: string;
    playlistId: string | null;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
    likeStatus: LikeStatus | null;
    feedbackTokens: MenuTokens | null;
}
export declare function parse_song(result: any): ParsedSong;
export interface FlatSong {
    type: "flat-song";
    title: string;
    videoId: string | null;
    artists: SongArtist[] | null;
    thumbnails: Thumbnail[];
    isExplicit: boolean;
    album: {
        name: string;
        id: string;
    } | null;
    views: string | null;
    likeStatus: LikeStatus | null;
}
export declare function parse_song_flat(data: any): FlatSong;
export interface ParsedVideo {
    type: "video";
    title: string;
    videoId: string;
    artists: SongArtist[] | null;
    playlistId: string | null;
    thumbnails: Thumbnail[];
    views: string | null;
    likeStatus: LikeStatus | null;
}
export declare function parse_video(result: any): ParsedVideo;
export type TrendChange = "UP" | "DOWN" | "NEUTRAL";
export declare function parse_top_song(result: any): Ranked<ParsedSong>;
export declare function parse_top_video(result: any): Ranked<ParsedVideo>;
export declare function parse_top_artist(result: any): Ranked<RelatedArtist>;
export declare function parse_trending(result: any): Ranked<ParsedSong> | Ranked<ParsedVideo>;
export interface ParsedPlaylist extends ShuffleAndRadioIds {
    type: "playlist";
    title: string;
    playlistId: string;
    thumbnails: Thumbnail[];
    songs: string | null;
    authors: ArtistRun[] | null;
    description: string | null;
    count: string | null;
    author: ArtistRun[] | null;
    libraryLikeStatus: LikeStatus | null;
}
export declare function parse_playlist(data: any): ParsedPlaylist;
export interface RelatedArtist extends ShuffleAndRadioIds {
    type: "artist" | "channel";
    name: string;
    browseId: string;
    subscribers: string | null;
    thumbnails: Thumbnail[];
}
export type Ranked<T> = T & {
    rank: string;
    change: TrendChange | null;
};
export declare function parse_related_artist(data: any): RelatedArtist;
export interface WatchPlaylist extends ShuffleAndRadioIds {
    type: "watch-playlist";
    title: string;
    playlistId: string;
    thumbnails: Thumbnail[];
}
export declare function parse_watch_playlist(data: any): WatchPlaylist;
type Translatable = keyof typeof STRINGS[keyof typeof STRINGS];
export declare function _(id: Translatable): string;
export declare function __(value: string): "artist" | "playlists" | "songs_on_repeat" | "artists_on_repeat" | "playlists_on_repeat" | "songs" | "albums" | "videos" | "featured_playlists" | "community_playlists" | "artists" | "profiles" | "episodes" | "podcasts" | "playlist" | "video" | "profile" | "singles" | "library" | "featured" | "related" | "new albums" | "moods" | "new videos" | "top songs" | "trending" | "top videos" | "top artists" | "genres" | null;
export declare function is_ranked<T>(item: T | Ranked<T>): item is Ranked<T>;
export declare function find_context_param(json: any, key: string): any;
export declare function parse_two_columns(json: any): {
    secondary: any;
    tab: any;
};
export declare function parse_description_runs(runs: any): any;
export {};
//# sourceMappingURL=browsing.d.ts.map