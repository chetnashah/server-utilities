
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");
const PORT = 3000;

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
    if (!req.query.filename) {
        return res.status(400).send({
            "statusMessage": "Missing required field (filename)"
        });
    }

    return res.status(200).send({
        "url": "somes3urlyoucanusetoupload.com"
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

