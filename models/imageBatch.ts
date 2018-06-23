import {ImageEntry} from './imageEntry';

/** 
 * Define an ImageBatch class which include a list of ImageEntry. Limited to 64.
 * @class ImageBatch
 */
export class ImageBatch {
    images: ImageEntry[];
    tagIds: string[] | null;

    /**
    * Create an ImageBatch.
    * @param {ImageEntry[]} images - The list of images. Limited to 64.
    * @param {string[] | null} tagIds - The list of tagIds.
    */
    constructor(images: ImageEntry[], tagIds: string[] | null) {
        this.images = images;
        this.tagIds = tagIds;
    }
}