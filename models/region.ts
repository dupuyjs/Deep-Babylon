/** 
 * Define a Region class which include a tag and bounding box.
 * @class Region
 */
export class Region {
    tagId: string;
    left: number;
    top: number;
    width: number;
    height: number;

    /**
    * Create a Region.
    * @param {string} tagId - The image tag value.
    * @param {number} left - The left value.
    * @param {number} top - The top value.
    * @param {number} width - The width value.
    * @param {number} height - The height value.
    */
    constructor(tagId: string, left: number, top: number, width: number, height: number) {
        this.tagId = tagId;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}