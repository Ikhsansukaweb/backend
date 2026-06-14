"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scopes = exports.filters = void 0;
exports.get_search_suggestions = get_search_suggestions;
exports.remove_search_history = remove_search_history;
exports.search = search;
exports.get_more_search_results = get_more_search_results;
const continuations_js_1 = require("../continuations.js");
const nav_js_1 = require("../nav.js");
const browsing_js_1 = require("../parsers/browsing.js");
const search_js_1 = require("../parsers/search.js");
const util_js_1 = require("../util.js");
const utils_js_1 = require("./utils.js");
const _request_js_1 = require("./_request.js");
const library_js_1 = require("../parsers/library.js");
var search_js_2 = require("../parsers/search.js");
Object.defineProperty(exports, "filters", { enumerable: true, get: function () { return search_js_2.filters; } });
Object.defineProperty(exports, "scopes", { enumerable: true, get: function () { return search_js_2.scopes; } });
async function get_search_suggestions(query, options = {}) {
    const json = await (0, _request_js_1.request_json)("music/get_search_suggestions", {
        params: {
            input: query,
        },
        signal: options.signal,
    });
    const results = (0, util_js_1.j)(json, "contents");
    const suggestions = {
        suggestions: [],
        quick_links: [],
        history: [],
    };
    if (results[0]) {
        const items = (0, util_js_1.j)(results[0], "searchSuggestionsSectionRenderer.contents");
        for (const item of items) {
            if ("historySuggestionRenderer" in item) {
                const query = (0, util_js_1.j)(item, "historySuggestionRenderer");
                suggestions.history.push({
                    search: (0, util_js_1.j)(query, "suggestion.runs"),
                    feedback_token: (0, util_js_1.j)(query, "serviceEndpoint.feedbackEndpoint.feedbackToken"),
                    query: (0, util_js_1.j)(query, "navigationEndpoint.searchEndpoint.query"),
                });
            }
            else if ("searchSuggestionRenderer" in item) {
                const query = (0, util_js_1.j)(item, "searchSuggestionRenderer");
                suggestions.suggestions.push({
                    search: (0, util_js_1.j)(query, "suggestion.runs"),
                    query: (0, util_js_1.j)(query, "navigationEndpoint.searchEndpoint.query"),
                });
            }
        }
    }
    if (results[1]) {
        const items = (0, util_js_1.j)(results[1], "searchSuggestionsSectionRenderer.contents");
        for (const item of items) {
            const data = (0, util_js_1.j)(item, nav_js_1.MRLIR);
            const flex_items = (0, util_js_1.j)(data, "flexColumns");
            if (flex_items.length === 2) {
                const first = (0, util_js_1.j)(flex_items[0], nav_js_1.MRLITFC);
                // artist
                suggestions.quick_links.push({
                    type: "artist",
                    thumbnails: (0, util_js_1.j)(data, nav_js_1.THUMBNAILS),
                    name: (0, util_js_1.j)(first, nav_js_1.RUN_TEXT),
                    id: (0, util_js_1.j)(data, nav_js_1.NAVIGATION_BROWSE_ID),
                });
            }
            else if (flex_items.length === 3) {
                // song or video
                const first = (0, util_js_1.j)(flex_items[0], nav_js_1.MRLITFC, "runs[0]");
                const second = (0, util_js_1.j)(flex_items[1], nav_js_1.MRLITFC);
                const artist = (0, util_js_1.j)(second, "runs[2]");
                const type = (0, browsing_js_1._)((0, util_js_1.j)(second, nav_js_1.RUN_TEXT).toLowerCase());
                switch (type) {
                    case "video":
                    case "song":
                        suggestions.quick_links.push({
                            type,
                            title: (0, util_js_1.j)(first, "text"),
                            videoId: (0, util_js_1.j)(first, nav_js_1.NAVIGATION_VIDEO_ID),
                            thumbnails: (0, util_js_1.j)(data, nav_js_1.THUMBNAILS),
                            artists: [
                                {
                                    name: (0, util_js_1.j)(artist, "text"),
                                    id: (0, util_js_1.j)(artist, nav_js_1.NAVIGATION_BROWSE_ID),
                                },
                            ],
                            isExplicit: (0, util_js_1.jo)(data, nav_js_1.BADGE_LABEL) != null,
                        });
                        break;
                    default:
                        console.warn("Unknown search suggestion return type", type);
                        break;
                }
            }
            // quick_links.push(item);
        }
    }
    return suggestions;
}
async function remove_search_history(token, options = {}) {
    await (0, utils_js_1.check_auth)();
    const json = (0, _request_js_1.request_json)("feedback", {
        data: { feedbackTokens: [token] },
        signal: options.signal,
    });
    return (0, library_js_1.parse_toast)(json);
}
async function search(query, options = {}) {
    const { filter, scope, autocorrect = true, limit = 20, continuation: _continuation = null, signal, } = options;
    let continuation = _continuation;
    const data = { query };
    const endpoint = "search";
    const search_results = {
        top_result: null,
        did_you_mean: null,
        categories: [],
        continuation: null,
        autocorrect: null,
        filters: [],
    };
    if (filter != null && !search_js_1.filters.includes(filter)) {
        throw new Error(`Invalid filter provided. Please use one of the following filters or leave out the parameter: ${search_js_1.filters.join(", ")}`);
    }
    if (scope != null && !search_js_1.scopes.includes(scope)) {
        throw new Error(`Invalid scope provided. Please use one of the following scopes or leave out the parameter: ${search_js_1.scopes.join(", ")}`);
    }
    if (scope == "uploads" && filter != null) {
        throw new Error("No filter can be set when searching uploads. Please unset the filter parameter when scope is set to uploads");
    }
    const params = (0, search_js_1.get_search_params)(filter, scope, autocorrect);
    if (params) {
        data.params = params;
    }
    if (!continuation) {
        const response = await (0, _request_js_1.request_json)(endpoint, { data, signal });
        let results;
        // no results
        if (!("contents" in response)) {
            return search_results;
        }
        else if ("tabbedSearchResultsRenderer" in response.contents) {
            const tab_index = (!scope || filter)
                ? 0
                : search_js_1.scopes.indexOf(scope) + 1;
            results = response.contents.tabbedSearchResultsRenderer.tabs[tab_index]
                .tabRenderer.content;
        }
        else {
            results = response.contents;
        }
        const section_list = (0, util_js_1.j)(results, nav_js_1.SECTION_LIST);
        const chips = (0, util_js_1.jo)(results, "sectionListRenderer.header.chipCloudRenderer.chips");
        if (chips) {
            chips
                .map((chip) => chip.chipCloudChipRenderer)
                .forEach((chip) => {
                const text = (0, util_js_1.jo)(chip, nav_js_1.TEXT_RUN_TEXT);
                if (!text)
                    return;
                const filter = (0, browsing_js_1.__)(text);
                if (filter && search_js_1.filters.includes(filter)) {
                    search_results.filters.push(filter);
                }
            });
        }
        // no results
        if (!section_list ||
            (section_list.length == 1 && ("itemSectionRenderer" in section_list[0]))) {
            return search_results;
        }
        for (const res of section_list) {
            if ("musicShelfRenderer" in res) {
                const results = (0, util_js_1.j)(res, "musicShelfRenderer.contents");
                const category = (0, util_js_1.jo)(res, nav_js_1.MUSIC_SHELF, nav_js_1.TITLE_TEXT);
                // skip episodes and podcasts
                if (["episodes", "podcasts"].includes((0, browsing_js_1.__)(category) ?? "")) {
                    continue;
                }
                const category_search_results = (0, search_js_1.parse_search_results)(results, scope ?? null, filter ?? null);
                if (category_search_results.length > 0) {
                    search_results.categories.push({
                        title: category ?? null,
                        filter: (0, browsing_js_1.__)(category) ?? null,
                        results: category_search_results,
                    });
                }
                if ("continuations" in res["musicShelfRenderer"]) {
                    continuation = res.musicShelfRenderer;
                }
            }
            else if ("musicCardShelfRenderer" in res) {
                // top result with details
                search_results.top_result = (0, search_js_1.parse_top_result)((0, util_js_1.j)(res, "musicCardShelfRenderer"));
            }
            else if ("itemSectionRenderer" in res) {
                const did_you_mean = (0, util_js_1.jo)(res, "itemSectionRenderer.contents[0].didYouMeanRenderer");
                if (did_you_mean) {
                    search_results.did_you_mean = {
                        search: (0, util_js_1.j)(did_you_mean, "correctedQuery.runs"),
                        query: (0, util_js_1.j)(did_you_mean, "correctedQueryEndpoint.searchEndpoint.query"),
                    };
                }
                const autocorrect = (0, util_js_1.jo)(res, "itemSectionRenderer.contents[0].showingResultsForRenderer");
                if (autocorrect) {
                    search_results.autocorrect = {
                        corrected: {
                            search: (0, util_js_1.j)(autocorrect, "correctedQuery.runs"),
                            query: (0, util_js_1.j)(autocorrect, "correctedQueryEndpoint.searchEndpoint.query"),
                        },
                        original: {
                            search: (0, util_js_1.j)(autocorrect, "originalQuery.runs"),
                            query: (0, util_js_1.j)(autocorrect, "originalQueryEndpoint.searchEndpoint.query"),
                        },
                    };
                }
            }
        }
    }
    // limit only works when there's a filter
    if (continuation && filter) {
        const continued_data = await get_more_search_results(continuation, {
            scope: scope ?? null,
            filter,
            limit: limit -
                search_results.categories.reduce((acc, curr) => acc + curr.results.length, 0),
            signal,
        });
        // TODO: don't lowercase translations
        // and this wont work when filters are translated (should default)
        // to the first category
        let category = search_results.categories.find((category) => category.filter === filter);
        if (!category) {
            category = search_results.categories[search_results.categories.push({
                title: (0, browsing_js_1._)(filter) ?? filter,
                filter,
                results: [],
            }) - 1];
        }
        search_results.continuation = continued_data.continuation;
        category.results.push(...continued_data.results);
    }
    return search_results;
}
async function get_more_search_results(continuation, options) {
    const { limit = 20, scope, filter, signal } = options;
    const continued_data = await (0, continuations_js_1.get_continuations)(continuation, "musicShelfContinuation", limit, (params) => {
        return (0, _request_js_1.request_json)("search", { params, signal });
    }, (contents) => {
        return (0, search_js_1.parse_search_results)(contents, scope ?? null, filter ?? null);
    });
    return {
        continuation: continued_data.continuation,
        results: continued_data.items,
    };
}
