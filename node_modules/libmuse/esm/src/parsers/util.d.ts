export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}
export interface MenuPlaylists {
    shuffleId: string | null;
    radioId: string | null;
}
export declare function get_menu_playlists(data: any): MenuPlaylists;
export declare function get_item_text(item: any, index: number, run_index?: number): any;
export declare function get_flex_column_item(item: any, index: number): any;
export declare function get_fixed_column_item(item: any, index: number): any;
export declare function parse_duration(duration?: string): number | null;
export declare function get_browse_id(item: any, index: number): string | null;
export declare function get_dot_separator_index(runs: any[]): number;
export declare function color_to_hex(a: number): string;
//# sourceMappingURL=util.d.ts.map