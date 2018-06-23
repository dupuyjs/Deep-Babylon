/**
* Decode an image from a base64 string.
* @function decodeBase64Image
* @param {string} dataString - base64 string.
*/
export function decodeBase64Image(dataString: string) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response: any = {};

    if (matches && matches.length !== 3) {
        return new Error('Invalid input string');
    }

    if (matches) {
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
    }

    return response;
}