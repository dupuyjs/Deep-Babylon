import * as babylon from 'babylonjs';
import * as loaders from 'babylonjs-loaders';
import * as materials from 'babylonjs-materials';

import * as fs from 'fs';
import * as gm from 'gm';
import * as path from 'path';
import * as bodyParser from 'body-parser';

import customvision from './services/cognitive-customvision';
import { decodeBase64Image } from './helpers/decodeBase64Image'
import { uuidv4 } from './helpers/uuidv4'
import { Region } from './models/region';
import { ImageBatch } from './models/imageBatch';
import { ImageEntry } from './models/imageEntry';
import { ServerSettings } from './server-settings'

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

app.get('/', async (req: any, res: any) => {
    res.render('index', { title: 'Deep Babylon' });
});


/**
* Parse all .labels.tsv files to get unique labels
* @param {string} dataPath - The data folder path.
* @return {Array<string>} Returns a list of labels.
*/
function getDataLabels(dataPath: string): Array<string> {

    let labels = new Array<string>();
    let items = fs.readdirSync(dataPath);
    for (let i = 0; i < items.length; i++) {
        let fileName = items[i];
        if (fileName.endsWith('.labels.tsv')) {
            let labelPath = path.join(dataPath, fileName);
            let label = fs.readFileSync(labelPath, { encoding: 'utf-8' }).toString();

            if (!labels.includes(label)) {
                labels.push(label);
            }
        }
    }

    return labels;
}

/**
* Parse all files in data folder path and send ImageBatch to Custom Vision service.
* @param {string} dataPath - The data folder path.
* @param {any} tags - List of tags.
* @param {string} projectId - The project id value.
*/
async function createBatch(dataPath: string, tags: any, projectId: string): Promise<void> {

    let tagIds = Object.keys(tags).map(function (key) {
        return tags[key];
    });

    let items = fs.readdirSync(dataPath);

    let index = 0;
    for (let i = 0; i < items.length / (ServerSettings.BATCH_SIZE * 3); i++) {
        let images = new Array<ImageEntry>();

        for (let j = 0; j < (ServerSettings.BATCH_SIZE * 3); j++) {
            let fileName = items[index];

            if (path.extname(fileName) == '.png') {
                let baseName = fileName.split('.')[0];
                let imagePath = path.join(dataPath, fileName);
                let bboxesPath = path.join(dataPath, baseName + '.bboxes.tsv');
                let labelsPath = path.join(dataPath, baseName + '.bboxes.labels.tsv');

                let imageBuffer = fs.readFileSync(imagePath);
                let bboxText = fs.readFileSync(bboxesPath, { encoding: 'utf-8' }).toString();
                let labelText = fs.readFileSync(labelsPath, { encoding: 'utf-8' }).toString();

                let bbox = bboxText.split('\t');

                let x1 = parseFloat(bbox[0]);
                let y1 = parseFloat(bbox[1]);
                let x2 = parseFloat(bbox[2]);
                let y2 = parseFloat(bbox[3]);

                let imageHeight = 0;
                let imageWidth = 0;
                gm(imagePath)
                    .size(function (err, size) {
                        if (!err) {
                            imageHeight = size.height;
                            imageWidth = size.width;
                        }
                    });

                let left = x1 / imageWidth;
                let top = y1 / imageHeight;
                let width = (x2 - x1) / imageWidth;
                let height = (y2 - y1) / imageHeight;

                let regions = new Array<Region>();
                regions.push(new Region(tags[labelText], left, top, width, height));

                images.push(new ImageEntry(baseName, imageBuffer.toJSON().data, null, regions))
                console.log(`Image ${baseName} added.`);
            }

            index++;
            if (index == items.length) break;
        }

        let batch = new ImageBatch(images, null);
        await customvision.createImagesFromFilesAsync(projectId, batch);
        console.log(`${index / 3} images sent.`);
    }
}

// GET API endpoint to start the training
app.get('/training', async (req: any, res: any) => {

    res.end('success');

    let labels = getDataLabels(ServerSettings.TRAININGDATA_PATH);
    let domain = await customvision.getObjectDetectionDomainAsync();

    if (domain) {
        let project = await customvision.createProjectAsync(ServerSettings.PROJECT_NAME, domain.id);

        if (project) {
            let tags: any = {};
            for (let label of labels) {
                let tag = await customvision.createImageTagAsync(project.id, label);

                if (tag) {
                    tags[tag.name] = tag.id;
                }
            }

            if (tags) {
                let batch = await createBatch(ServerSettings.TRAININGDATA_PATH, tags, project.id);
            }
        }
    }
});

// POST API endpoint to receive base64 string and save images locally with associated bounding box and labels
app.post('/image', (req: any, res: any) => {
    let data: string = req.body.data;
    let bboxes = req.body.bboxes;
    let labels = req.body.labels;

    let imageBuffer = decodeBase64Image(data);
    let guid = uuidv4();

    const mkdirSync = function (dirPath: string) {
        try {
            fs.mkdirSync(dirPath)
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }

    mkdirSync(path.resolve(ServerSettings.TRAININGDATA_PATH))

    fs.writeFile(`./data/screenshot${guid}.png`, imageBuffer.data, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing .png file', error);
        } else {
            // data written successfully
            console.log(`.png file written successfully`);
        }
    });

    fs.writeFile(`./data/screenshot${guid}.bboxes.tsv`, bboxes, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing file', error);
        } else {
            // data written successfully
            console.log(`.bboxes.tsv file written successfully`);
        }
    });

    fs.writeFile(`./data/screenshot${guid}.bboxes.labels.tsv`, labels, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing file', error);
        } else {
            // data written successfully
            console.log(`.bboxes.lebels.tsv file written successfully`);
        }
    });

    res.end('success');
})

// bind to a port
let server = app.listen(process.env.port || process.env.PORT || 8081, () => {
    console.log(`server started on http://${server.address().address}:${server.address().port}`);
});






