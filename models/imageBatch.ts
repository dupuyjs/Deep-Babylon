import {ImageEntry} from './imageEntry';

export class ImageBatch {
    images: ImageEntry[];
    tagIds: string[] | null;

    constructor(images: ImageEntry[], tagIds: string[] | null) {
        this.images = images;
        this.tagIds = tagIds;
    }
}