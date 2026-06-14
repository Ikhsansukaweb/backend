declare namespace _default {
    let CLIENT_ID: string;
    let CLIENT_SECRET: string;
    let SCOPE: string;
    let HEADERS: {
        "User-Agent": string;
        Accept: string;
        "Accept-Language": string;
        Referer: string;
        "X-Youtube-Client-Name": string;
        "X-Youtube-Client-Version": string;
        "X-Goog-AuthUser": string;
        "X-Origin": string;
        Origin: string;
        "Sec-Fetch-Dest": string;
        "Sec-Fetch-Mode": string;
        "Sec-Fetch-Site": string;
        TE: string;
    };
    namespace DATA {
        namespace context {
            namespace client {
                let hl: string;
                let gl: string;
                let remoteHost: string;
                let deviceMake: string;
                let deviceModel: string;
                let userAgent: string;
                let clientName: string;
                let clientVersion: string;
                let osName: string;
                let osVersion: string;
                let originalUrl: string;
                let platform: string;
                let clientFormFactor: string;
                let browserName: string;
                let browserVersion: string;
                let acceptHeader: string;
                let screenWidthPoints: number;
                let screenHeightPoints: number;
                let screenPixelDensity: number;
                let screenDensityFloat: number;
                let utcOffsetMinutes: number;
                let userInterfaceTheme: string;
                let timeZone: string;
                namespace musicAppInfo {
                    let pwaInstallabilityStatus: string;
                    let webDisplayMode: string;
                    namespace storeDigitalGoodsApiSupportStatus {
                        let playStoreDigitalGoodsApiSupportStatus: string;
                    }
                }
            }
            namespace user {
                let lockedSafetyMode: boolean;
            }
            namespace request {
                let useSsl: boolean;
                let internalExperimentFlags: never[];
                let consistencyTokenJars: never[];
            }
        }
    }
    let API_URL: string;
    namespace ANDROID {
        export namespace DATA_1 {
            export namespace context_1 {
                export namespace client_1 {
                    let screenWidthPoints_1: number;
                    export { screenWidthPoints_1 as screenWidthPoints };
                    let screenHeightPoints_1: number;
                    export { screenHeightPoints_1 as screenHeightPoints };
                    let screenPixelDensity_1: number;
                    export { screenPixelDensity_1 as screenPixelDensity };
                    let utcOffsetMinutes_1: number;
                    export { utcOffsetMinutes_1 as utcOffsetMinutes };
                    let hl_1: string;
                    export { hl_1 as hl };
                    let gl_1: string;
                    export { gl_1 as gl };
                    let remoteHost_1: string;
                    export { remoteHost_1 as remoteHost };
                    let deviceMake_1: string;
                    export { deviceMake_1 as deviceMake };
                    let deviceModel_1: string;
                    export { deviceModel_1 as deviceModel };
                    let userAgent_1: string;
                    export { userAgent_1 as userAgent };
                    let clientName_1: string;
                    export { clientName_1 as clientName };
                    let clientVersion_1: string;
                    export { clientVersion_1 as clientVersion };
                    let osName_1: string;
                    export { osName_1 as osName };
                    let osVersion_1: string;
                    export { osVersion_1 as osVersion };
                    let originalUrl_1: string;
                    export { originalUrl_1 as originalUrl };
                    export let theme: string;
                    let platform_1: string;
                    export { platform_1 as platform };
                    let clientFormFactor_1: string;
                    export { clientFormFactor_1 as clientFormFactor };
                    export let webpSupport: boolean;
                    let timeZone_1: string;
                    export { timeZone_1 as timeZone };
                    let acceptHeader_1: string;
                    export { acceptHeader_1 as acceptHeader };
                }
                export { client_1 as client };
                export namespace user_1 {
                    let enableSafetyMode: boolean;
                }
                export { user_1 as user };
                export namespace request_1 {
                    let internalExperimentFlags_1: never[];
                    export { internalExperimentFlags_1 as internalExperimentFlags };
                    let consistencyTokenJars_1: never[];
                    export { consistencyTokenJars_1 as consistencyTokenJars };
                }
                export { request_1 as request };
            }
            export { context_1 as context };
        }
        export { DATA_1 as DATA };
    }
    namespace IOS {
        export namespace DATA_2 {
            export namespace context_2 {
                export namespace client_2 {
                    let screenWidthPoints_2: number;
                    export { screenWidthPoints_2 as screenWidthPoints };
                    let screenHeightPoints_2: number;
                    export { screenHeightPoints_2 as screenHeightPoints };
                    let screenPixelDensity_2: number;
                    export { screenPixelDensity_2 as screenPixelDensity };
                    let utcOffsetMinutes_2: number;
                    export { utcOffsetMinutes_2 as utcOffsetMinutes };
                    let hl_2: string;
                    export { hl_2 as hl };
                    let gl_2: string;
                    export { gl_2 as gl };
                    let remoteHost_2: string;
                    export { remoteHost_2 as remoteHost };
                    let deviceMake_2: string;
                    export { deviceMake_2 as deviceMake };
                    let deviceModel_2: string;
                    export { deviceModel_2 as deviceModel };
                    let userAgent_2: string;
                    export { userAgent_2 as userAgent };
                    let clientName_2: string;
                    export { clientName_2 as clientName };
                    let clientVersion_2: string;
                    export { clientVersion_2 as clientVersion };
                    let osName_2: string;
                    export { osName_2 as osName };
                    let osVersion_2: string;
                    export { osVersion_2 as osVersion };
                    let originalUrl_2: string;
                    export { originalUrl_2 as originalUrl };
                    let theme_1: string;
                    export { theme_1 as theme };
                    let platform_2: string;
                    export { platform_2 as platform };
                    let clientFormFactor_2: string;
                    export { clientFormFactor_2 as clientFormFactor };
                    let webpSupport_1: boolean;
                    export { webpSupport_1 as webpSupport };
                    let timeZone_2: string;
                    export { timeZone_2 as timeZone };
                    let acceptHeader_2: string;
                    export { acceptHeader_2 as acceptHeader };
                }
                export { client_2 as client };
                export namespace user_2 {
                    let enableSafetyMode_1: boolean;
                    export { enableSafetyMode_1 as enableSafetyMode };
                }
                export { user_2 as user };
                export namespace request_2 {
                    let internalExperimentFlags_2: never[];
                    export { internalExperimentFlags_2 as internalExperimentFlags };
                    let consistencyTokenJars_2: never[];
                    export { consistencyTokenJars_2 as consistencyTokenJars };
                }
                export { request_2 as request };
            }
            export { context_2 as context };
        }
        export { DATA_2 as DATA };
    }
}
export default _default;
//# sourceMappingURL=constants-ng.d.ts.map