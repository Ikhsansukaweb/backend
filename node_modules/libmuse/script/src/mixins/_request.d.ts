import { FetchData } from "../request.js";
export declare function get_auth_headers(): Promise<{
    Authorization?: string;
}>;
export declare function request(endpoint: string, options: FetchData): Promise<Response>;
export declare function request_json(endpoint: string, options: FetchData): Promise<any>;
//# sourceMappingURL=_request.d.ts.map