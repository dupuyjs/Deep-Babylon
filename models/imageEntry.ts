import {Region} from './region';

/** 
 * Define an ImageEntry class which include image and associated regions.
 * @class ImageEntry
 */
export class ImageEntry {
    name: string;
    contents: any[];
    tagIds: string[]| null;
    regions: Region[];

    /**
    * Create an ImageEntry.
    * @param {string} name - The image name value.
    * @param {any[]} contents - The image content.
    * @param {string[] | null} tagIds - The list of tagIds.
    * @param {Region[]} regions - The list of regions.
    */
    constructor(name: string, contents: any[], tagIds: string[] | null, regions: Region[]) {
        this.name = name;
        this.contents = contents;
        this.tagIds = tagIds;
        this.regions = regions;
    }
}