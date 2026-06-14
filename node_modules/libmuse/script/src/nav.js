"use strict";
// commonly used navigation paths
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBTITLE = exports.TEXT_RUN_TEXT = exports.TEXT_RUN = exports.TEXT_RUNS = exports.TITLE_TEXT = exports.TITLE = exports.FRAMEWORK_MUTATIONS = exports.CAROUSEL_THUMBNAILS = exports.CAROUSEL_SUBTITLE = exports.CAROUSEL_TITLE = exports.CAROUSEL_CONTAINER = exports.CAROUSEL_CONTENTS = exports.IMMERSIVE_CAROUSEL = exports.CAROUSEL = exports.DESCRIPTION = exports.DESCRIPTION_SHELF = exports.HEADER_DETAIL = exports.PLAY_PLAYLIST_ID = exports.PLAY_VIDEO_ID = exports.PLAY_WATCH = exports.NAVIGATION_VIDEO_TYPE = exports.NAVIGATION_WATCH_PLAYLIST_ID = exports.NAVIGATION_PLAYLIST_ID = exports.NAVIGATION_VIDEO_ID = exports.NAVIGATION_PAGE_TYPE = exports.PAGE_TYPE = exports.NAVIGATION_PARAMS = exports.NAVIGATION_BROWSE_ID = exports.NAVIGATION_BROWSE = exports.PLAY_BUTTON = exports.MORE_BUTTON = exports.TOGGLE_MENU = exports.MENU_SERVICE = exports.MENU_LIKE_STATUS = exports.MENU_ITEMS = exports.MENU = exports.GRID_ITEMS = exports.GRID = exports.MUSIC_SHELF = exports.ITEM_SECTION = exports.SECTION_LIST_ITEM = exports.SECTION_LIST = exports.SINGLE_COLUMN_TAB = exports.SINGLE_COLUMN = exports.TAB_1_CONTENT = exports.TAB_CONTENT = exports.RUN_TEXT = exports.CONTENT = exports.THUMBNAILS = exports.THUMBNAIL = void 0;
exports.RESPONSIVE_HEADER = exports.TWO_COLUMN_RESULTS = exports.MRLITFC = exports.MENU_PLAYLIST_ID = exports.SECTION_LIST_CONTINUATION = exports.TASTE_PROFILE_ARTIST = exports.TASTE_PROFILE_ITEMS = exports.MTCIR = exports.MTRIR = exports.MRLIR = exports.CATEGORY_COLOR = exports.CATEGORY_PARAMS = exports.CATEGORY_TITLE = exports.SINGLE_BADGE_LABEL = exports.SUBTITLE_BADGE_LABEL = exports.BADGE_LABEL = exports.BADGE_PATH = exports.SINGLE_BADGE_PATH = exports.FEEDBACK_TOKEN = exports.THUMBNAIL_CROPPED = exports.THUMBNAIL_RENDERER = exports.SUBTITLE3 = exports.SUBTITLE2 = void 0;
exports.find_object_by_key = find_object_by_key;
exports.find_objects_by_key = find_objects_by_key;
exports.find_object_by_icon_name = find_object_by_icon_name;
const util_js_1 = require("./util.js");
exports.THUMBNAIL = "thumbnail.thumbnails";
exports.THUMBNAILS = `thumbnail.musicThumbnailRenderer.${exports.THUMBNAIL}`;
exports.CONTENT = "contents[0]";
exports.RUN_TEXT = "runs[0].text";
exports.TAB_CONTENT = "tabs[0].tabRenderer.content";
exports.TAB_1_CONTENT = "tabs[1].tabRenderer.content";
exports.SINGLE_COLUMN = "contents.singleColumnBrowseResultsRenderer";
exports.SINGLE_COLUMN_TAB = `${exports.SINGLE_COLUMN}.${exports.TAB_CONTENT}`;
exports.SECTION_LIST = "sectionListRenderer.contents";
exports.SECTION_LIST_ITEM = `sectionListRenderer.${exports.CONTENT}`;
exports.ITEM_SECTION = `itemSectionRenderer.${exports.CONTENT}`;
exports.MUSIC_SHELF = "musicShelfRenderer";
exports.GRID = "gridRenderer";
exports.GRID_ITEMS = `${exports.GRID}.items`;
exports.MENU = "menu.menuRenderer";
exports.MENU_ITEMS = `${exports.MENU}.items`;
exports.MENU_LIKE_STATUS = `${exports.MENU}.topLevelButtons[0].likeButtonRenderer.likeStatus`;
exports.MENU_SERVICE = "menuServiceItemRenderer.serviceEndpoint";
exports.TOGGLE_MENU = "toggleMenuServiceItemRenderer";
exports.MORE_BUTTON = "moreContentButton.buttonRenderer";
exports.PLAY_BUTTON = "overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer";
exports.NAVIGATION_BROWSE = "navigationEndpoint.browseEndpoint";
exports.NAVIGATION_BROWSE_ID = `${exports.NAVIGATION_BROWSE}.browseId`;
exports.NAVIGATION_PARAMS = `${exports.NAVIGATION_BROWSE}.params`;
exports.PAGE_TYPE = "browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType";
exports.NAVIGATION_PAGE_TYPE = `${exports.NAVIGATION_BROWSE}.${exports.PAGE_TYPE}`;
exports.NAVIGATION_VIDEO_ID = "navigationEndpoint.watchEndpoint.videoId";
exports.NAVIGATION_PLAYLIST_ID = "navigationEndpoint.watchEndpoint.playlistId";
exports.NAVIGATION_WATCH_PLAYLIST_ID = "navigationEndpoint.watchPlaylistEndpoint.playlistId";
exports.NAVIGATION_VIDEO_TYPE = "watchEndpoint.watchEndpointMusicSupportedConfigs.watchEndpointMusicConfig.musicVideoType";
exports.PLAY_WATCH = "playNavigationEndpoint.watchEndpoint";
exports.PLAY_VIDEO_ID = `${exports.PLAY_WATCH}.videoId`;
exports.PLAY_PLAYLIST_ID = `${exports.PLAY_WATCH}.playlistId`;
exports.HEADER_DETAIL = "header.musicDetailHeaderRenderer";
exports.DESCRIPTION_SHELF = "musicDescriptionShelfRenderer";
exports.DESCRIPTION = `description.${exports.RUN_TEXT}`;
exports.CAROUSEL = "musicCarouselShelfRenderer";
exports.IMMERSIVE_CAROUSEL = "musicImmersiveCarouselShelfRenderer";
exports.CAROUSEL_CONTENTS = `${exports.CAROUSEL}.contents`;
exports.CAROUSEL_CONTAINER = "header.musicCarouselShelfBasicHeaderRenderer";
exports.CAROUSEL_TITLE = `${exports.CAROUSEL_CONTAINER}.title.runs[0]`;
exports.CAROUSEL_SUBTITLE = `${exports.CAROUSEL_CONTAINER}.strapline.runs[0]`;
exports.CAROUSEL_THUMBNAILS = `${exports.CAROUSEL_CONTAINER}.${exports.THUMBNAILS}`;
exports.FRAMEWORK_MUTATIONS = "frameworkUpdates.entityBatchUpdate.mutations";
exports.TITLE = "title.runs[0]";
exports.TITLE_TEXT = `title.${exports.RUN_TEXT}`;
exports.TEXT_RUNS = "text.runs";
exports.TEXT_RUN = `${exports.TEXT_RUNS}[0]`;
exports.TEXT_RUN_TEXT = `${exports.TEXT_RUN}.text`;
exports.SUBTITLE = `subtitle.${exports.RUN_TEXT}`;
exports.SUBTITLE2 = "subtitle.runs[2].text";
exports.SUBTITLE3 = "subtitle.runs[4].text";
exports.THUMBNAIL_RENDERER = `thumbnailRenderer.musicThumbnailRenderer.${exports.THUMBNAIL}`;
exports.THUMBNAIL_CROPPED = `thumbnail.croppedSquareThumbnailRenderer.${exports.THUMBNAIL}`;
exports.FEEDBACK_TOKEN = "feedbackEndpoint.feedbackToken";
exports.SINGLE_BADGE_PATH = "musicInlineBadgeRenderer.accessibilityData.accessibilityData.label";
exports.BADGE_PATH = `0.${exports.SINGLE_BADGE_PATH}`;
exports.BADGE_LABEL = `badges.${exports.BADGE_PATH}`;
exports.SUBTITLE_BADGE_LABEL = `subtitleBadges.${exports.BADGE_PATH}`;
exports.SINGLE_BADGE_LABEL = `subtitleBadge.0.${exports.SINGLE_BADGE_PATH}`;
exports.CATEGORY_TITLE = "musicNavigationButtonRenderer.buttonText.runs";
exports.CATEGORY_PARAMS = "musicNavigationButtonRenderer.clickCommand.browseEndpoint.params";
exports.CATEGORY_COLOR = "musicNavigationButtonRenderer.solid.leftStripeColor";
exports.MRLIR = "musicResponsiveListItemRenderer";
exports.MTRIR = "musicTwoRowItemRenderer";
exports.MTCIR = "musicTwoColumnItemRenderer";
exports.TASTE_PROFILE_ITEMS = `contents.tastebuilderRenderer.contents`;
exports.TASTE_PROFILE_ARTIST = `title.runs`;
exports.SECTION_LIST_CONTINUATION = `continuationContents.sectionListContinuation`;
exports.MENU_PLAYLIST_ID = `${exports.MENU_ITEMS}.0.menuNavigationItemRenderer.${exports.NAVIGATION_WATCH_PLAYLIST_ID}`;
exports.MRLITFC = "musicResponsiveListItemFlexColumnRenderer.text";
exports.TWO_COLUMN_RESULTS = "twoColumnBrowseResultsRenderer";
exports.RESPONSIVE_HEADER = "musicResponsiveHeaderRenderer";
function find_object_by_key(objectList, key, nested, isKey = false) {
    for (const item of objectList) {
        const obj = nested ? item[nested] : item;
        if (key in obj) {
            return isKey ? obj[key] : obj;
        }
    }
    return null;
}
function find_objects_by_key(object_list, key, nested) {
    const objects = [];
    for (const item of object_list) {
        const obj = nested ? item[nested] : item;
        if (key in obj) {
            objects.push(obj);
        }
    }
    return objects;
}
function find_object_by_icon_name(objectList, key, icons) {
    return objectList && objectList.length > 0
        ? objectList.find((item) => {
            if (!Object.hasOwn(item, key))
                return false;
            const menu = item[key];
            const icon = (0, util_js_1.jo)(menu, "defaultIcon.iconType") ??
                (0, util_js_1.jo)(menu, "icon.iconType");
            if (!icon)
                return false;
            return [icons].flat().includes(icon);
        })
        : null;
}
