"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define an ImageEntry class which include image and associated regions.
 * @class ImageEntry
 */
class ImageEntry {
    /**
    * Create an ImageEntry.
    * @param {string} name - The image name value.
    * @param {any[]} contents - The image content.
    * @param {string[] | null} tagIds - The list of tagIds.
    * @param {Region[]} regions - The list of regions.
    */
    constructor(name, contents, tagIds, regions) {
        this.name = name;
        this.contents = contents;
        this.tagIds = tagIds;
        this.regions = regions;
    }
}
exports.ImageEntry = ImageEntry;
//# sourceMappingURL=imageEntry.js.map