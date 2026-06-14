import "../_dnt.polyfills.js";
type OrLowercase<T extends string> = T | Lowercase<T>;
/**
 * Request options
 */
export interface FetchData {
    method?: OrLowercase<"GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "TRACE">;
    headers?: Record<string, string>;
    data?: Record<string, any> | Uint8Array;
    params?: Record<string, string>;
    raw_data?: boolean;
    signal?: AbortSignal;
}
export type RequestFunction = (url: string, options: RequestInit) => Promise<Response>;
export declare abstract class RequestClient {
    abstract request(url: string, options: FetchData): Promise<Response>;
    auth_header: string | null;
    request_json<T>(url: string, options: FetchData): Promise<T>;
}
export declare class FetchClient extends RequestClient {
    constructor();
    private do_fetch;
    request(path: string, options: FetchData): Promise<Response>;
}
export {};
//# sourceMappingURL=request.d.ts.map