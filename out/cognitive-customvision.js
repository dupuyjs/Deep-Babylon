"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
/**
 * Custom Vision Training 2.0
 * @class CustomVisionServices
 */
class CustomVisionServices {
    constructor() {
        this.baseUrl = 'https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Training/';
    }
    async getObjectDectionDomain() {
        let domains = undefined;
        let url = this.baseUrl + 'domains';
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_TRAININGKEY;
        if (visionKey == undefined) {
            throw new Error('custom vision api key or url is undefined');
        }
        let response = await node_fetch_1.default(url, {
            method: 'GET',
            headers: {
                'Training-Key': visionKey
            }
        })
            .catch(error => console.error(error));
        ;
        if (response && response.status && response.status >= 200 && response.status <= 299) {
            domains = await response.json();
        }
        if (domains) {
            for (let domain of domains) {
                if (domain.type == 'ObjectDetection') {
                    console.log('Get the object detection model.');
                    return domain;
                }
            }
        }
        return undefined;
    }
    async createProject(name, domainId) {
        let json = undefined;
        let url = this.baseUrl + `projects?name=${name}&domainId=${domainId}`;
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_TRAININGKEY;
        if (visionKey == undefined) {
            throw new Error('custom vision api key or url is undefined');
        }
        let response = await node_fetch_1.default(url, {
            method: 'POST',
            headers: {
                'Training-Key': visionKey
            }
        })
            .catch(error => console.error(error));
        ;
        if (response && response.status && response.status >= 200 && response.status <= 299) {
            json = await response.json();
        }
        console.log('Created object detection project.');
        return json;
    }
    async createImageTag(projectId, name) {
        let json = undefined;
        let url = this.baseUrl + `projects/${projectId}/tags?name=${name}`;
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_TRAININGKEY;
        if (visionKey == undefined) {
            throw new Error('custom vision api key or url is undefined');
        }
        let response = await node_fetch_1.default(url, {
            method: 'POST',
            headers: {
                'Training-Key': visionKey
            }
        })
            .catch(error => console.error(error));
        ;
        if (response && response.status && response.status >= 200 && response.status <= 299) {
            json = await response.json();
        }
        console.log('Created image tag.');
        return json;
    }
    async createImagesFromFiles(projectId, batch) {
        let json = undefined;
        let url = this.baseUrl + `projects/${projectId}/images/files `;
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_TRAININGKEY;
        if (visionKey == undefined) {
            throw new Error('custom vision api key or url is undefined');
        }
        let body = JSON.stringify(batch);
        let response = await node_fetch_1.default(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Training-Key': visionKey
            },
            body: body
        })
            .catch(error => console.error(error));
        ;
        if (response && response.status && response.status >= 200 && response.status <= 299) {
            json = await response.json();
        }
        console.log(`Batch sent.`);
        return json.isBatchSuccessful;
    }
}
exports.CustomVisionServices = CustomVisionServices;
let customVisionServices = new CustomVisionServices();
exports.default = customVisionServices;
//# sourceMappingURL=cognitive-customvision.js.map