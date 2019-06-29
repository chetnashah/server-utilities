
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");
const PORT = 3000;

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

app.listen(PORT, () => {
    console.log(`App listening on Port: ${PORT}`);
});

