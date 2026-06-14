import { Album, ArtistRun, LikeStatus } from "./songs.js";
import { Thumbnail } from "./util.js";
export interface UploadedItem {
    entityId: string;
    videoId: string;
    title: string;
    duration: string;
    duration_seconds: number | null;
    artists: ArtistRun[] | null;
    album: Album | null;
    likeStatus: LikeStatus;
    thumbnails: Thumbnail[];
}
export declare function parse_uploaded_items(results: any[]): UploadedItem[];
//# sourceMappingURL=uploads.d.ts.map