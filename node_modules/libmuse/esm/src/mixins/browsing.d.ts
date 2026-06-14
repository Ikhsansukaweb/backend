import { AlbumHeader } from "../parsers/albums.js";
import { ArtistContents, ChannelContents, MixedContent, Mood, ParsedAlbum, ParsedPlaylist } from "../parsers/browsing.js";
import { PlaylistItem, VideoType } from "../parsers/playlists.js";
import { ArtistRun, Format } from "../parsers/songs.js";
import { Thumbnail } from "./playlist.js";
import { AbortOptions, PaginationOptions, SortOptions } from "./utils.js";
export { is_ranked } from "../parsers/browsing.js";
export type { Category, ExploreContents, FlatSong, MixedContent, MixedItem, Mood, ParsedAlbum, ParsedMoodOrGenre, ParsedPlaylist, ParsedSong, ParsedVideo, Ranked, RelatedArtist, WatchPlaylist, } from "../parsers/browsing.js";
export type { AudioFormat, Format, LikeStatus, VideoFormat, } from "../parsers/songs.js";
export type { ArtistRun, Thumbnail };
export interface Home {
    continuation: string | null;
    moods: Mood[];
    thumbnails: Thumbnail[];
    results: MixedContent[];
}
export interface HomeOptions extends PaginationOptions {
    params?: string;
}
export declare function get_home(options?: HomeOptions): Promise<Home>;
export interface Artist extends ArtistContents {
    views: string | null;
    description: string | null;
    name: string;
    channelId: string;
    shuffleId: string | null;
    radioId: string | null;
    subscribers: string | null;
    subscribed: boolean;
    thumbnails: Thumbnail[];
    songs: {
        browseId: string | null;
        results: PlaylistItem[];
    };
}
export declare function get_artist(artistId: string, options?: AbortOptions): Promise<Artist>;
export interface AlbumResult extends AlbumHeader {
    id: string;
    tracks: PlaylistItem[];
    other_versions: ParsedAlbum[] | null;
    duration_seconds: number;
}
export declare function get_album(browseId: string, options?: AbortOptions): Promise<AlbumResult>;
export interface VideoDetails {
    videoId: string;
    title: string;
    lengthSeconds: number;
    channelId: string;
    isOwnerViewing: boolean;
    isCrawlable: boolean;
    thumbnail: {
        thumbnails: Thumbnail[];
    };
    allowRatings: true;
    viewCount: number;
    author: string;
    isPrivate: boolean;
    isUnpluggedCorpus: boolean;
    musicVideoType: VideoType;
    isLiveContent: boolean;
}
export interface Caption {
    url: string;
    name: string;
    vssId: string;
    lang: string;
    translatable: boolean;
}
export interface Song {
    /** @deprecated */
    formats: Format[];
    adaptive_formats: Format[];
    expires: Date;
    videoDetails: VideoDetails;
    playerConfig: any;
    playbackTracking: any;
    videostatsPlaybackUrl: string;
    captions: Caption[];
    hlsManifestUrl: string | null;
    aspectRatio: number;
    serverAbrStreamingUrl: string;
}
export declare function get_album_browse_id(audio_playlist_id: string, options?: AbortOptions): Promise<string | null>;
export declare function get_song(video_id: string, options?: AbortOptions): Promise<Song>;
export declare function get_song_related(browseId: string, options?: AbortOptions): Promise<MixedContent[]>;
export interface BaseTimedLyrics {
    source: string;
    timed: boolean;
}
export interface UnTimedLyrics extends BaseTimedLyrics {
    timed: false;
    lyrics: string | null;
}
export interface TimedLyrics extends BaseTimedLyrics {
    timed: true;
    lyrics: string;
    timed_lyrics: {
        line: string;
        start: number;
        end: number;
        id: string;
    }[];
}
export type Lyrics = TimedLyrics | UnTimedLyrics;
export declare function get_lyrics(browseId: string, options?: AbortOptions): Promise<Lyrics>;
export interface ArtistAlbums {
    artist: string | null;
    title: string;
    results: ParsedAlbum[];
    sort: SortOptions;
}
export declare function get_artist_albums(channelId: string, params: string, options?: Omit<PaginationOptions, "limit">): Promise<ArtistAlbums>;
export interface Channel extends ChannelContents {
    name: string;
    channelId: string;
    thumbnails: Thumbnail[];
    songs_on_repeat: {
        results: PlaylistItem[];
    } | null;
}
export declare function get_channel(channelId: string, options?: AbortOptions): Promise<Channel>;
/**
 * @deprecated Use `get_channel` instead.
 */
export declare const get_user: typeof get_channel;
export interface ChannelPlaylists {
    artist: string;
    title: string;
    results: ParsedPlaylist[];
}
export declare function get_channel_playlists(channelId: string, params: string, options?: AbortOptions): Promise<ChannelPlaylists>;
/**
 * @deprecated Use `get_channel_playlists` instead.
 */
export declare const get_user_playlists: typeof get_channel_playlists;
//# sourceMappingURL=browsing.d.ts.map