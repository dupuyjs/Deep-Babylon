"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cognitive_customvision_1 = require("./cognitive-customvision");
const decodeBase64Image_1 = require("./helpers/decodeBase64Image");
const uuidv4_1 = require("./helpers/uuidv4");
const region_1 = require("./models/region");
const imageBatch_1 = require("./models/imageBatch");
const imageEntry_1 = require("./models/imageEntry");
// Loading environment variables
const dotenv = require('dotenv').config();
// Include Express
let express = require('express');
// Create a new Express application
let app = express();
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'stylesheets')));
app.use(express.static(path.join(__dirname, 'assets')));
app.get('/', async (req, res) => {
    res.render('index', { title: 'Deep Babylon' });
});
/********* Settings  ***********/
const IMAGE_HEIGHT = 855;
const IMAGE_WIDTH = 1531;
const BATCH_SIZE = 20;
const TRAININGDATA_PATH = './data';
async function createBatch(dataPath, tagId, projectId) {
    let tagIds = [tagId];
    let items = fs.readdirSync(dataPath);
    let index = 0;
    for (let i = 0; i < items.length / (BATCH_SIZE * 2); i++) {
        let images = new Array();
        for (let j = 0; j < (BATCH_SIZE * 2); j++) {
            let fileName = items[index];
            if (path.extname(fileName) == '.png') {
                let baseName = fileName.split('.')[0];
                let imagePath = path.join(dataPath, fileName);
                let bboxesPath = path.join(dataPath, baseName + '.bboxes.tsv');
                let imageBuffer = fs.readFileSync(imagePath);
                let bboxText = fs.readFileSync(bboxesPath, { encoding: 'utf-8' }).toString();
                let bbox = bboxText.split('\t');
                let x1 = parseFloat(bbox[0]);
                let y1 = parseFloat(bbox[1]);
                let x2 = parseFloat(bbox[2]);
                let y2 = parseFloat(bbox[3]);
                let left = x1 / IMAGE_WIDTH;
                let top = y1 / IMAGE_HEIGHT;
                let width = (x2 - x1) / IMAGE_WIDTH;
                let height = (y2 - y1) / IMAGE_HEIGHT;
                let regions = new Array();
                regions.push(new region_1.Region(tagId, left, top, width, height));
                images.push(new imageEntry_1.ImageEntry(baseName, imageBuffer.toJSON().data, tagIds, regions));
                console.log(`Image ${baseName} added.`);
            }
            index++;
            if (index == items.length)
                break;
        }
        let batch = new imageBatch_1.ImageBatch(images, tagIds);
        await cognitive_customvision_1.default.createImagesFromFiles(projectId, batch);
        console.log(`${index / 2} images sent.`);
    }
    // for (let i = 0; i < items.length; i++) {
    //     let images = new Array<ImageEntry>();
    //     let fileName = items[i];
    //     if (path.extname(fileName) == '.png') {
    //         let baseName = fileName.split('.')[0];
    //         let imagePath = path.join(dataPath, fileName);
    //         let bboxesPath = path.join(dataPath, baseName + '.bboxes.tsv');
    //         let imageBuffer = fs.readFileSync(imagePath);
    //         let bboxText = fs.readFileSync(bboxesPath, { encoding: 'utf-8' }).toString();
    //         let bbox = bboxText.split('\t');
    //         let x1 = parseFloat(bbox[0]);
    //         let y1 = parseFloat(bbox[1]);
    //         let x2 = parseFloat(bbox[2]);
    //         let y2 = parseFloat(bbox[3]);
    //         let left = x1 / IMAGE_WIDTH;
    //         let top = y1 / IMAGE_HEIGHT;
    //         let width = (x2 - x1) / IMAGE_WIDTH;
    //         let height = (y2 - y1) / IMAGE_HEIGHT;
    //         let regions = new Array<Region>();
    //         regions.push(new Region(tagId, left, top, width, height));
    //         images.push(new ImageEntry(baseName, imageBuffer.toJSON().data, tagIds, regions))
    //         console.log(`Image ${baseName} added.`);
    //         let batch = new ImageBatch(images, tagIds);
    //         customvision.createImagesFromFiles(projectId, batch);
    //     }
    // };
}
app.get('/training', async (req, res) => {
    let tagName = "xbox joystick";
    let domain = await cognitive_customvision_1.default.getObjectDectionDomain();
    if (domain) {
        let project = await cognitive_customvision_1.default.createProject('Deep Babylon', domain.id);
        if (project) {
            let tag = await cognitive_customvision_1.default.createImageTag(project.id, tagName);
            if (tag) {
                let batch = await createBatch(TRAININGDATA_PATH, tag.id, project.id);
                //await customvision.createImagesFromFiles(project.id, batch);
            }
        }
    }
});
app.post('/image', (req, res) => {
    let data = req.body.data;
    let bbox = req.body.bbox;
    let imageBuffer = decodeBase64Image_1.decodeBase64Image(data);
    let guid = uuidv4_1.uuidv4();
    fs.writeFile(`./data/screenshot${guid}.png`, imageBuffer.data, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing .png file', error);
        }
        else {
            // data written successfully
            console.log(`.png file written successfully`);
        }
    });
    fs.writeFile(`./data/screenshot${guid}.bboxes.tsv`, bbox, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing file', error);
        }
        else {
            // data written successfully
            console.log(`.bboxes.tsv file written successfully`);
        }
    });
    res.end('success');
});
// bind to a port
app.listen(process.env.port || process.env.PORT || 8081, () => {
    console.log('server started');
});
//# sourceMappingURL=app.js.map