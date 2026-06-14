export declare function parse_playlists_categories(results: any): {
    title: string | null;
    params: string | null;
    playlists: (import("./browsing.js").WatchPlaylist | import("./browsing.js").ParsedSong | import("./browsing.js").ParsedAlbum | import("./browsing.js").RelatedArtist | import("./browsing.js").ParsedPlaylist)[];
}[];
export type PlaylistCategory = ReturnType<typeof parse_playlists_categories>[number];
//# sourceMappingURL=explore.d.ts.map