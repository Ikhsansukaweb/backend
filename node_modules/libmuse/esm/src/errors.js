export var ERROR_CODE;
(function (ERROR_CODE) {
    ERROR_CODE[ERROR_CODE["GENERIC"] = 0] = "GENERIC";
    ERROR_CODE[ERROR_CODE["NOT_AVAILABLE"] = 1] = "NOT_AVAILABLE";
    /* Params */
    ERROR_CODE[ERROR_CODE["INVALID_PARAMETER"] = 2] = "INVALID_PARAMETER";
    ERROR_CODE[ERROR_CODE["NOT_FOUND"] = 3] = "NOT_FOUND";
    /* Auth */
    ERROR_CODE[ERROR_CODE["AUTH_GENERIC"] = 4] = "AUTH_GENERIC";
    ERROR_CODE[ERROR_CODE["AUTH_CANT_GET_LOGIN_CODE"] = 5] = "AUTH_CANT_GET_LOGIN_CODE";
    ERROR_CODE[ERROR_CODE["AUTH_INVALID_TOKEN"] = 6] = "AUTH_INVALID_TOKEN";
    ERROR_CODE[ERROR_CODE["AUTH_INVALID_REFRESH_TOKEN"] = 7] = "AUTH_INVALID_REFRESH_TOKEN";
    ERROR_CODE[ERROR_CODE["AUTH_NO_TOKEN"] = 8] = "AUTH_NO_TOKEN";
    ERROR_CODE[ERROR_CODE["AUTH_REQUIRED"] = 9] = "AUTH_REQUIRED";
    /* Parsing */
    ERROR_CODE[ERROR_CODE["PARSING_INVALID_JSON"] = 10] = "PARSING_INVALID_JSON";
    /* Locales */
    ERROR_CODE[ERROR_CODE["UNSUPPORTED_LOCATION"] = 11] = "UNSUPPORTED_LOCATION";
    ERROR_CODE[ERROR_CODE["UNSUPPORTED_LANGUAGE"] = 12] = "UNSUPPORTED_LANGUAGE";
    /* Uploads */
    ERROR_CODE[ERROR_CODE["UPLOADS_INVALID_FILETYPE"] = 13] = "UPLOADS_INVALID_FILETYPE";
})(ERROR_CODE || (ERROR_CODE = {}));
export class MuseError extends Error {
    constructor(code, message, options) {
        super(message, options);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "MuseError"
        });
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.code = code;
    }
}
