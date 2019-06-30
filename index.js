require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const PORT = 3000;
const s3 = new AWS.S3();

const s3config = {
    region: 'ap-south-1',
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
};

console.log(s3config);

const bucket = 'test-signing-upload-bucket';
const expirySecs = 60*25;

s3.config.update(s3config);

// accept multipart/form-data which manipulates req.body and req.file/req.files
const upload = multer({ 'dest': 'uploads/'});

app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:4000', 'http://localhost:7000']
}));

// accept application/json
app.use(bodyParser.json());

// accept application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.status(200).send(JSON.stringify({
        msg: 'hello world'
    }));
});

app.get('/getPresignedUrl', (req, res) => {
    if (!req.query.filename || !req.query['contenttype']) {
        return res.status(400).send({
            "statusMessage": "Missing required field (filename or content-type)"
        });
    }

    const signingOptions = {
        'Bucket': bucket,
        'Key': req.query.filename,
        Expires: expirySecs,
        'ContentType': req.query['contenttype']
    };
    console.log(signingOptions);

    s3.getSignedUrl('putObject', signingOptions, (err, url) => {
        if(err) {
            return res.status(500).send({
                error: JSON.stringify(err)
            });
        }
        return res.status(200).send({
            url: url
        });
    });
});


app.get('/renderform', (req, res) => {
    return res.sendFile(__dirname + "/index.html");
});

app.post('/formpostwithfile', upload.single('avatar'), (req, res, next) => {
    console.log('req.file is avatar file & req.body will hold text fields');
    return res.status(200).send({"statusMessage": "Uploaded file successfully using post form"});
});

app.listen(PORT, () => {
    console.log(`App listening on Port: ${PORT}`);
});

