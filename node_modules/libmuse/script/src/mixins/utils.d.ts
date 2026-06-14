import { LikeStatus } from "../parsers/songs.js";
import { get_option } from "../setup.js";
export { get_option };
export declare function prepare_like_endpoint(status: LikeStatus): "like/like" | "like/dislike" | "like/removelike";
/**
 * Get number of days since the unix epoch
 */
export declare function get_timestamp(): number;
export declare function check_auth(): Promise<void>;
export declare function html_to_text(html: string): string;
export declare const order_params: Map<"a_to_z" | "z_to_a" | "recently_added", "ggMGKgQIARAA" | "ggMGKgQIARAB" | "ggMGKgQIABAB">;
export declare const orders: ("a_to_z" | "z_to_a" | "recently_added")[];
export type Order = typeof orders[number];
export declare function validate_order_parameter(order?: Order): void;
export declare function prepare_order_params(order?: Order): "ggMGKgQIARAA" | "ggMGKgQIARAB" | "ggMGKgQIABAB" | undefined;
export declare const library_order_continuations: Map<"recently_added" | "recent_activity" | "recently_played", "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCaEFCb0FZQg%3D%3D" | "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlBQkFCb0FZQg%3D%3D" | "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCUkFCb0FZQg%3D%3D">;
export declare const library_orders: ("recently_added" | "recent_activity" | "recently_played")[];
export type LibraryOrder = typeof library_orders[number];
export declare function validate_library_sort_parameter(sort?: LibraryOrder): void;
export declare function prepare_library_sort_params(sort?: LibraryOrder): "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCaEFCb0FZQg%3D%3D" | "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlBQkFCb0FZQg%3D%3D" | "4qmFsgIrEhdGRW11c2ljX2xpYnJhcnlfbGFuZGluZxoQZ2dNR0tnUUlCUkFCb0FZQg%3D%3D" | undefined;
export declare function randomString(len: number): any;
export interface AbortOptions {
    signal?: AbortSignal;
}
export interface PaginationOptions extends AbortOptions {
    limit?: number;
    continuation?: string;
}
export interface PaginationAndOrderOptions extends PaginationOptions {
    order?: Order;
}
export interface SortOptions {
    selected: string;
    options: {
        title: string;
        continuation: string;
    }[];
}
export declare function get_sort_options(chips: any): SortOptions;
//# sourceMappingURL=utils.d.ts.map