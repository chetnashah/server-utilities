require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const PORT = 3000;
const s3 = new AWS.S3();
import { User } from './models';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcryptjs';

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

// passport local middleware
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    function(username, password, done){
        console.log('password localstrategy got username: ', username, ' password: ', password);
        User;
        done(null, false, { message: 'Missing implementation!'});
    }
));

app.get('/login', (req,res, next) => {
    res.status(200).send({
        message: 'You have reached login!'
    });
});

app.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: false
    })
);

app.get('/', (req, res) => {
    res.status(200).send(JSON.stringify({
        msg: 'hello world'
    }));
});

app.post('/registeruser', (req, res) => {
    if(!req.body.email || !req.body.password || !req.body.phoneNumber){
        return res.status(400).send("Missing required fields!");
    }

    //Note: arrow functions do not work with this bcrypt library
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, function(err, hash) {
            if(err) {
                return res.status(500).send(err);
            }
            User.create({ password: hash, email: req.body.email, phoneNumber: req.body.phoneNumber }).then(user => {
                console.log("user's auto-generated ID:", user.id);
                return res.status(200).send(JSON.stringify(user));
            });        
        })
    })

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

