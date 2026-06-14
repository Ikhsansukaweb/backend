import { VideoType } from "./playlists.js";
import { LikeStatus, MenuTokens, SongRuns } from "./songs.js";
import { Thumbnail } from "./util.js";
export declare function parse_queue_playlist(results: any): QueueTrack[];
/**
 * An object showing information about a track to be represented in a queue
 */
export interface QueueTrack extends SongRuns {
    /**
     * The video ID of the track
     */
    videoId: string;
    /**
     * The name of the track
     */
    title: string;
    /**
     * The duration (in words) of the track, for example "1:34"
     */
    duration: string | null;
    /**
     * The duration in seconds of the track, parsed from `duration`
     */
    duration_seconds: number | null;
    /**
     * The thumbnails of the track
     */
    thumbnails: Thumbnail[];
    /**
     * Feedback tokens to use while adding/removing this track from the library
     */
    feedbackTokens: MenuTokens | null;
    /**
     * Whether or not this track is liked/disliked by the listener
     */
    likeStatus: LikeStatus | null;
    /**
     * The metadata type of this track
     */
    videoType: VideoType | null;
    /**
     * Whether this track is explicit or not
     */
    isExplicit: boolean;
    /**
     * The counterpart of the track.
     *
     * If this track is a video, the counterpart refers to the audio-only version
     * of the song or vice versa.
     */
    counterpart: QueueTrack | null;
}
export declare function parse_queue_track(data: any): QueueTrack;
export declare function get_tab_browse_id(watchNextRenderer: any, tab_id: number): string | null;
//# sourceMappingURL=queue.d.ts.map