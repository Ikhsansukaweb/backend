import { JSONPathOptions } from "./deps.js";
/**
 * Wait a given number of milliseconds, then resolve
 */
export declare const wait: (ms: number) => Promise<unknown>;
/**
 * Logs debug messages to the console
 */
export declare const debug: (...args: unknown[]) => void;
export declare const jom: (json: unknown, path: string, resultType?: JSONPathOptions["resultType"]) => any;
export declare const jo: (json: unknown, path: string, ...others: string[]) => any;
export declare const j: (json: unknown, path: string, ...others: string[]) => any;
export declare function sum_total_duration(item: any): any;
//# sourceMappingURL=util.d.ts.map