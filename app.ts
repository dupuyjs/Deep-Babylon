import * as babylon from 'babylonjs';
import * as loaders from 'babylonjs-loaders';
import * as materials from 'babylonjs-materials';
import * as AzureStorage from 'azure-storage';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';

function decodeBase64Image(dataString: string) {
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

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Include Express
let express = require('express');
let path = require('path');

// Create a new Express application
let app = express();

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'stylesheets')));
app.use(express.static(path.join(__dirname, 'assets')));

// Add a basic route – index page
app.get('/', (req: any, res: any) => {
    res.render('index', { title: 'Deep Babylon' });
});

app.post('/image', (req: any, res: any) => {
    let data = req.body.data;

    let imageBuffer = decodeBase64Image(data);
    let guid = uuidv4();

    fs.writeFile(`./data/screenshot${guid}.png`, imageBuffer.data, (error) => {
        if (error) {
            // there was an error
            console.log('issue when writing file', error);
        } else {
            // data written successfully
            console.log(`file written successfully`);
        }
    });

    res.end('success');
})

// bind to a port
app.listen(process.env.port || process.env.PORT || 8081, () => {
    console.log('server started');
});






