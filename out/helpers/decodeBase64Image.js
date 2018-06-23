"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
* Decode an image from a base64 string.
* @function decodeBase64Image
* @param {string} dataString - base64 string.
*/
function decodeBase64Image(dataString) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {};
    if (matches && matches.length !== 3) {
        return new Error('Invalid input string');
    }
    if (matches) {
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
    }
    return response;
}
exports.decodeBase64Image = decodeBase64Image;
//# sourceMappingURL=decodeBase64Image.js.map