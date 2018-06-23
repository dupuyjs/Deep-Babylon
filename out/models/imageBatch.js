"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define an ImageBatch class which include a list of ImageEntry. Limited to 64.
 * @class ImageBatch
 */
class ImageBatch {
    /**
    * Create an ImageBatch.
    * @param {ImageEntry[]} images - The list of images. Limited to 64.
    * @param {string[] | null} tagIds - The list of tagIds.
    */
    constructor(images, tagIds) {
        this.images = images;
        this.tagIds = tagIds;
    }
}
exports.ImageBatch = ImageBatch;
//# sourceMappingURL=imageBatch.js.map