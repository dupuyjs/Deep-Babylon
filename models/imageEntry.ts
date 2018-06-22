import {Region} from './region';

export class ImageEntry {
    name: string;
    contents: any[];
    tagIds: string[]| null;
    regions: Region[];

    constructor(name: string, contents: any[], tagIds: string[] | null, regions: Region[]) {
        this.name = name;
        this.contents = contents;
        this.tagIds = tagIds;
        this.regions = regions;
    }
}