"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define a Region class which include a tag and bounding box.
 * @class Region
 */
class Region {
    /**
    * Create a Region.
    * @param {string} tagId - The image tag value.
    * @param {number} left - The left value.
    * @param {number} top - The top value.
    * @param {number} width - The width value.
    * @param {number} height - The height value.
    */
    constructor(tagId, left, top, width, height) {
        this.tagId = tagId;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}
exports.Region = Region;
//# sourceMappingURL=region.js.map