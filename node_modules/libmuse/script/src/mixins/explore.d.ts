import { ChartContents, ExploreContents, MixedContent } from "../parsers/browsing.js";
import { PlaylistCategory } from "../parsers/explore.js";
import { AbortOptions } from "./utils.js";
export declare function get_explore(options?: AbortOptions): Promise<ExploreContents>;
export interface Charts {
    countries: {
        selected: boolean;
        code: string;
        title: string;
    }[];
    results: ChartContents;
}
export declare function get_charts(country?: string, options?: AbortOptions): Promise<Charts>;
export interface MoodCategories {
    categories: {
        title: string;
        items: {
            title: string;
            color: string;
            params: string;
        }[];
    }[];
}
export declare function get_mood_categories(options?: AbortOptions): Promise<MoodCategories>;
export interface MoodPlaylists {
    title: string;
    categories: PlaylistCategory[];
}
export declare function get_mood_playlists(params: string, options?: AbortOptions): Promise<MoodPlaylists>;
export interface NewReleases {
    title: string;
    categories: MixedContent[];
}
export declare function get_new_releases(options?: AbortOptions): Promise<NewReleases>;
//# sourceMappingURL=explore.d.ts.map