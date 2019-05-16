const azureStorage = require('azure-storage')
const express = require('express');
const path = require('path');
const moment = require('moment');
const intoStream = require('into-stream');
const multer = require('multer');
const queryString = require('query-string')
const fetch = require('node-fetch')

if (process.env.NODE_ENV !== "production") {
    console.log('importing config');
    require("dotenv").config();
}

const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const ACCOUNT_ACCESS_KEY = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const HOST = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
const COGNITIVE_URI = 'https://southeastasia.api.cognitive.microsoft.com/vision/v2.0/analyze';

const containerName = 'upload';

const blobService = azureStorage.createBlobService(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY, HOST)

blobService.createContainerIfNotExists(containerName, {
    publicAccessLevel: 'blob'
}, (error, container) => {
    if(error) {
        return console.log('cannot create container: ', error)
    } else {
        console.log(container.name)
    }
})

const app = express();

const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath))

const inMemoryStorage = multer.memoryStorage()
const uploadStrategy = multer({ storage: inMemoryStorage }).single('imgUpload')

const port = process.env.PORT || 3000;

var cognitiveParams = {
    "visualFeatures": "Categories,Description,Color",
    "details": "",
    "language": "en",
};

const generateNewName = (name) => {
    const datetimeStr = moment().format('YYYYMMDDhhmmss');
    return `${datetimeStr}-${name}`
};

app.get('/analyze', async (req, res) => {
    var image = req.query.image

    const uri = COGNITIVE_URI + "?" + queryString.stringify(cognitiveParams)
    
    const result = await fetch(uri, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.AZURE_COGNITIVE_SUBSCRIPTION_KEY
        },
        body: JSON.stringify({url: image})
    });

    const json = await result.json()

    res.send(json)
})

app.post('/upload', uploadStrategy, (req, res) => {
    const fileName = req.file.originalname
    const blobName = generateNewName(fileName)
    const stream = intoStream(req.file.buffer)
    const length = req.file.buffer.length
    blobService.createBlockBlobFromStream(containerName, blobName, stream, length, err => {
        if(err) {
            return console.log('error on uploading blob', err)
        }
        
        const url = blobService.getUrl(containerName, blobName);
        console.log()
        res.send({
            'url': url
        })
    })
});



app.listen(port, () => {
    console.log(`server running at ${port}`);
});

