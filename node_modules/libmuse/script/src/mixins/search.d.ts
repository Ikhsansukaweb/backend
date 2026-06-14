import { Filter, Scope, SearchContent } from "../parsers/search.js";
import { Thumbnail } from "./playlist.js";
import { AbortOptions, PaginationOptions } from "./utils.js";
import { TopResult } from "../mod.js";
export type { Filter, Scope, SearchAlbum, SearchArtist, SearchContent, SearchPlaylist, SearchProfile, SearchRadio, SearchSong, SearchVideo, TopResult, TopResultAlbum, TopResultArtist, TopResultSong, TopResultVideo, TopResultPlaylist, } from "../parsers/search.js";
export { filters, scopes } from "../parsers/search.js";
export type SearchRuns = {
    text: string;
    bold?: true;
    italics?: true;
}[];
export interface ArtistQuickLink {
    type: "artist";
    thumbnails: Thumbnail[];
    name: string;
    id: string;
}
export interface SongQuickLink {
    type: "song" | "video";
    thumbnails: Thumbnail[];
    title: string;
    videoId: string;
    artists: {
        name: string;
        id: string;
    }[];
    isExplicit: boolean;
}
export type SearchQuickLink = ArtistQuickLink | SongQuickLink;
export interface SearchSuggestions {
    history: {
        search: SearchRuns;
        feedback_token: string;
        query: string;
    }[];
    suggestions: {
        query: string;
        search: SearchRuns;
    }[];
    quick_links: SearchQuickLink[];
}
export declare function get_search_suggestions(query: string, options?: AbortOptions): Promise<SearchSuggestions>;
export declare function remove_search_history(token: string, options?: AbortOptions): Promise<string | null>;
export interface SearchOptions extends PaginationOptions {
    filter?: Filter;
    scope?: Scope;
    ignore_spelling?: boolean;
}
export interface SearchResults {
    top_result: TopResult | null;
    did_you_mean: {
        search: SearchRuns;
        query: string;
    } | null;
    categories: {
        title: string;
        filter: Filter | null;
        results: SearchContent[];
    }[];
    continuation: string | null;
    autocorrect: {
        original: {
            search: SearchRuns;
            query: string;
        };
        corrected: {
            search: SearchRuns;
            query: string;
        };
    } | null;
    filters: Filter[];
}
export interface SearchOptions extends PaginationOptions {
    filter?: Filter;
    scope?: Scope;
    autocorrect?: boolean;
}
export declare function search(query: string, options?: SearchOptions): Promise<SearchResults>;
export interface MoreSearchResultOptions extends PaginationOptions {
    filter?: Filter | null;
    scope?: Scope | null;
}
export declare function get_more_search_results(continuation: string, options: Omit<MoreSearchResultOptions, "continuation">): Promise<{
    continuation: string;
    results: SearchContent[];
}>;
//# sourceMappingURL=search.d.ts.map