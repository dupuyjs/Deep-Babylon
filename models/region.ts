export class Region {
    tagId: string;
    left: number;
    top: number;
    width: number;
    height: number;

    constructor(tagId: string, left: number, top: number, width: number, height: number) {
        this.tagId = tagId;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}