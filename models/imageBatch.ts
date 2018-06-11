import {ImageEntry} from './imageEntry';

export class ImageBatch {
    images: ImageEntry[];
    tagIds: string[];

    constructor(images: ImageEntry[], tagIds: string[]) {
        this.images = images;
        this.tagIds = tagIds;
    }
}