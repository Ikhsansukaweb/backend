import { QueueTrack } from "../parsers/queue.js";
import { AbortOptions, PaginationOptions } from "./utils.js";
export type { QueueTrack } from "../parsers/queue.js";
export interface QueueOptions extends PaginationOptions {
    /**
     * Whether to create a radio for a playlist or video.
     * This is a list of tracks that are similar to the given content
     */
    radio?: boolean;
    /**
     * Whether to return the playlist tracks in shuffled mode
     */
    shuffle?: boolean;
    /**
     * Return additional tracks that should play after the selected content has
     * finished playing
     */
    autoplay?: boolean;
    /**
     * An additional string that influences what kind of personalized radio is
     * played. This is usually got from the `chips` attribute returned by
     * `get_queue`
     */
    params?: string;
}
/**
 * A chip for a personalised queue for a specific mood or genre. This allows
 * to play a different radio for a queue based on the listener's preference
 */
export interface QueueChip {
    /**
     * The display label of the personalised queue
     */
    title: string;
    /**
     * The playlistID that this queue is based on
     */
    playlistId: string;
    /**
     * A token to pass to `get_queue` to get this specific queue
     */
    params: string;
}
/**
 * A description of a "queue" or "watch playlist" for a track or playlist
 *
 * This is usually returned by `get_queue` @function
 */
export interface Queue {
    /**
     * Chips for personalised queues based on a specific mood or criterion
     */
    chips: QueueChip[];
    /**
     * The ID of the playlist this queue is referring to
     */
    playlistId: string | null;
    /**
     * @deprecated use `playlistName`
     */
    playlist: string | null;
    /**
     * The name of the playlist this queue is referring to
     */
    playlistName: string | null;
    /**
     * A list of tracks composing this queue
     */
    tracks: QueueTrack[];
    /**
     * Pointer to get lyrics for the first queue track
     */
    lyrics: string | null;
    /**
     * Pointer to get related information for the first queue track
     */
    related: string | null;
    /**
     * The author of the queue.
     *
     * This is usually only set for playlist queues, and referrs to the creator of
     * the playlist.
     */
    author: {
        name: string | null;
        id: string | null;
    } | null;
    /**
     * A pointer to get the next tracks of the queue
     */
    continuation: string | null;
    /**
     * The "current" track to jump to when playing this queue.
     *
     * This is set when you passed both `videoId` and `playlistId` to `get_queue`
     * and referrs to a track inside the playlist the listener wants to click, for
     * example when they clicked on a specific track in a playlist, `get_queue`
     * will return all playlist tracks but set this property so that you can
     * quickly jump to the required track.
     */
    current: {
        videoId: string;
        playlistId: string;
        index: number;
    } | null;
}
/**
 * Gets a "queue" or "watch playlist" for a track or playlist
 *
 * This function returns all the information required to create a queue from a
 * singular track or a playlist
 * @param videoId the track ID to create a queue for
 *
 * If `playlistId` is also specified, this should be a track within the given
 * playlist.
 * @param playlistId the playlist ID to create a queue for
 * @param options
 * @returns
 */
export declare function get_queue(videoId: string | null, playlistId?: string | null, options?: QueueOptions): Promise<Queue>;
/**
 * Gets the QueueTrack metadata for the specified `videoId`s
 * @param videoIds track IDs to look queues for
 * @param options
 * @returns a list of QueueTracks for each videoId
 */
export declare function get_queue_tracks(videoIds: string[], options?: AbortOptions): Promise<QueueTrack[]>;
/**
 * @function
 * @deprecated use `get_queue_tracks`
 */
export declare const get_queue_ids: typeof get_queue_tracks;
//# sourceMappingURL=queue.d.ts.map