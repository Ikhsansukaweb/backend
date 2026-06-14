export declare enum ERROR_CODE {
    GENERIC = 0,
    NOT_AVAILABLE = 1,
    INVALID_PARAMETER = 2,
    NOT_FOUND = 3,
    AUTH_GENERIC = 4,
    AUTH_CANT_GET_LOGIN_CODE = 5,
    AUTH_INVALID_TOKEN = 6,
    AUTH_INVALID_REFRESH_TOKEN = 7,
    AUTH_NO_TOKEN = 8,
    AUTH_REQUIRED = 9,
    PARSING_INVALID_JSON = 10,
    UNSUPPORTED_LOCATION = 11,
    UNSUPPORTED_LANGUAGE = 12,
    UPLOADS_INVALID_FILETYPE = 13
}
export declare class MuseError extends Error {
    name: string;
    code: ERROR_CODE;
    constructor(code: ERROR_CODE, message: string, options?: ErrorOptions);
}
//# sourceMappingURL=errors.d.ts.map