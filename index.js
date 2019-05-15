const {
    Aborter,
    BlockBlobURL,
    ContainerURL,
    ServiceURL,
    SharedKeyCredential,
    StorageURL,
    uploadStreamToBlockBlob,
    uploadFileToBlockBlob
} = require('@azure/storage-blob');

const express = require('express');
const path = require('path')

const app = express();

const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath))

const port = process.env.port || 3000;

app.listen(3000, () => {
    console.log(`server running at ${port}`);
});

