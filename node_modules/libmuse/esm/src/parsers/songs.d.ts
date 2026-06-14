export interface AudioFormat extends BaseFormat {
    has_audio: true;
    has_video: false;
    audio_quality: "tiny" | "low" | "medium" | "high";
    channels: number;
    sample_rate: number;
    audio_codec: string | null;
    quality: "tiny" | "small" | "medium" | "large";
}
export interface VideoFormat extends BaseFormat {
    has_video: true;
    has_audio: true;
    width: number;
    height: number;
    quality_label: "144p" | "144p 15fps" | "144p60 HDR" | "240p" | "240p60 HDR" | "270p" | "360p" | "360p60 HDR" | "480p" | "480p60 HDR" | "720p" | "720p60" | "720p60 HDR" | "1080p" | "1080p60" | "1080p60 HDR" | "1440p" | "1440p60" | "1440p60 HDR" | "2160p" | "2160p60" | "2160p60 HDR" | "4320p" | "4320p60";
    fps: number;
    video_codec: string | null;
    video_quality: "tiny" | "small" | "medium" | "large" | "hd720" | "hd1080" | "hd1440" | "hd2160" | "highres";
}
export type BaseFormat = {
    has_video: boolean;
    has_audio: boolean;
    codecs: string;
    url: string;
    duration_ms: number;
    average_bitrate: number | null;
    bitrate: number;
    content_length: number | null;
    index_range: {
        end: number;
        start: number;
    } | null;
    init_range: {
        end: number;
        start: number;
    } | null;
    itag: number;
    modified: Date;
    mime_type: string;
    projection_type: "rectangular" | "360" | "stereoscopic" | "3d";
    container: "flv" | "3gp" | "mp4" | "webm" | "ts";
};
export type Format = VideoFormat | AudioFormat;
export type SongArtist = ArtistRun;
export declare function parse_song_artists(data: any, index: number, slice?: number): SongArtist[] | null;
export interface ArtistRun {
    name: string;
    id: string | null;
    type: "artist" | "channel";
}
export declare function parse_song_artists_runs(runs: any): ArtistRun[];
export interface SongRuns {
    artists: SongArtist[];
    album: Album | null;
    views: string | null;
    duration: string | null;
    duration_seconds: number | null;
    year: string | null;
}
export declare function parse_song_runs(runs: any[], slice_start?: number): SongRuns;
export interface Album {
    name: string;
    id: string | null;
}
export declare function parse_song_album(data: any, index: number): Album | null;
export interface MenuTokens {
    add: string | null;
    remove: string | null;
    saved: boolean;
}
export declare function parse_song_menu_tokens(item: any): MenuTokens;
export declare function get_menu_tokens(item: any): MenuTokens | null;
export declare function get_menu_like_status(item: any): LikeStatus | null;
export declare function get_buttons_like_status(item: any): LikeStatus | null;
export interface ShuffleAndRadioIds {
    shuffleId: string | null;
    radioId: string | null;
}
export declare function get_shuffle_and_radio_ids(item: any): ShuffleAndRadioIds;
export declare function parse_menu_library_like_status(item: any): LikeStatus | null;
export declare function get_library_like_status(item: any): LikeStatus | null;
export declare function parse_format(format: any): BaseFormat;
export type LikeStatus = "LIKE" | "INDIFFERENT" | "DISLIKE";
export declare function parse_like_status(service: any): LikeStatus;
//# sourceMappingURL=songs.d.ts.map