require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const morgan = require('morgan');
const PORT = 3000;
const s3 = new AWS.S3();
import {
    User,
    File
} from './models';
import passport from 'passport';
import {
    Strategy as LocalStrategy
} from 'passport-local';
import bcrypt from 'bcryptjs';

// accept application/json
app.use(bodyParser.json());

// accept application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));
morgan.token('allResHeaders', function (req, res) {
    return JSON.stringify(res.getHeaders());
})

app.use(
    morgan(function (tokens, req, res) {
        return [
            '---------st--------',
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'), '-',
            tokens['response-time'](req, res),
            'msssssssssss',
            tokens.allResHeaders(req, res),
            '---------end---------'
        ].join(' ')
    })
)

var admin = require('firebase-admin');
var serviceAccount = require("../envfiles/service-utilities-firebase-adminsdk-bhw83-0b99ce539e.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://service-utilities.firebaseio.com"
});
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const cookieDomain = process.env.NODE_ENV === 'production' ? 'utilities-frontend.jayshah.co' : 'localhost';

app.use(session({
    secret: 'keyboard cat',
    cookie: {
        maxAge: 60000,
        domain: cookieDomain
    },
    resave: true,
    httpOnly: false,
    secure: false,
    saveUninitialized: true,
    store: new SQLiteStore(),
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    console.log('serializing user: ', user.id);
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findOne({
        where: {
            id: id
        }
    }).then(user => {
        console.log('desrialized user:');
        console.log(user);
        done(null, user);
    }).catch(err => {
        console.log('error deserializing user: id = ', id);
        done(err, null);
    })
});

const s3config = {
    region: 'ap-south-1',
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
};

console.log(s3config);

const bucket = 'test-signing-upload-bucket';
const expirySecs = 60 * 25;

s3.config.update(s3config);

// accept multipart/form-data which manipulates req.body and req.file/req.files
const upload = multer({
    'dest': 'uploads/'
});

app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:4000', 'http://localhost:7000', 'https://utilities-frontend.jayshah.co']
}));

app.get('/pinger', (req, res, next) => {
    console.log('pinger, req.session - ');
    console.log(req.session);
    console.log('pinger, req.user = ');
    console.log(req.user);
    if (req.isAuthenticated()) {
        return res.status(200).send('authenticated pong');
    }
    return res.status(200).send({
        action: 'logout'
    });
});

// passport local middleware
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function (username, password, done) {
        if (!username || !password) {
            done('Missing username or password', null);
        }
        User.findOne({
            where: {
                email: username
            }
        }).then((user) => {
            console.log('found user: ', user.get({
                plain: true
            }));

            if (!user) {
                done('No user found', false, {
                    message: 'no user found'
                });
            }
            if (user) {
                bcrypt.compare(password, user.password, (err, success) => {
                    if (err) {
                        done(null, false, {
                            message: 'error comparing password'
                        });
                    }
                    if (success) {
                        console.log('successfully authenticated user: ', user.get({
                            plain: true
                        }));
                        done(null, user);
                    } else {
                        done(null, false, {
                            message: 'Incorrect password!'
                        });
                    }
                })
            }
        }).catch((err) => {
            console.log('error finding user in db');
            done(null, false, {
                message: 'catch block error!'
            });
        })
        console.log('password localstrategy got username: ', username, ' password: ', password);
    }
));

app.get('/login', (req, res, next) => {
    res.status(200).send({
        message: 'You have reached login!'
    });
});

app.post('/login',
    function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                var redir = {
                    redirect: "/login"
                };
                return res.status(200).json(redir);
            }
            req.logIn(user, function (err) { // this is necessary to setup req.user from session
                if (err) {
                    return next(err);
                }
                console.log('res.headers = ');
                console.log(res.getHeaders());
                var redir = {
                    success: true,
                    redirect: "/"
                };
                return res.status(200).json(redir);
            });
        })(req, res, next);
    }
);

app.post('/logout', function (req, res, next) {
    req.session.destroy(function () {
        res.clearCookie('connect.sid');
        return res.status(200).send(JSON.stringify({
            redirect: '/'
        }))
    });
});

app.get('/allmyfiles', (req, res) => {
    if (!req.isAuthenticated) {
        return res.status(200).send(JSON.stringify({
            statusCode: -1,
            statusMessage: "Invalid session",
            action: 'logout'
        }));
    }
})

app.post('/postfcmtoken', (req, res) => {

    var registrationToken = req.body.fcmToken;

    var message = {
        data: {
            score: '850',
            time: '2:45'
        },
        token: registrationToken
    };
    console.log(message);
    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            res.status(200).send();
        })
        .catch((error) => {
            res.status(500).send();
            console.log('Error sending message:', error);
        });

});

app.post('/registeruser', (req, res) => {
    if (!req.body.email || !req.body.password || !req.body.phoneNumber) {
        return res.status(400).send("Missing required fields!");
    }

    //Note: arrow functions do not work with this bcrypt library
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            if (err) {
                return res.status(500).send(err);
            }
            User.create({
                password: hash,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber
            }).then(user => {
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
        if (err) {
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
    if (!req.isAuthenticated()) {
        return res.status(400).send({
            message: 'User not authenticated, cannot perform operation'
        });
    }
    File.create({
        url: 'yettobedecided',
        name: '' + Date.now(),
        size: 100
    }).then(file => {
        console.log("file's auto-generated ID:", file.id);
        console.log('req.user = ');
        console.log(req.user);
        req.user.setFiles([file]).then(() => {
            // saved!
            console.log('saved file with user:');
            return res.status(200).send(JSON.stringify(file));
        }).catch(err => {
            console.log('error saving user files');
            return res.status(500).send(JSON.stringify(err));
        });
    }).catch(err => {
        return res.status(500).send(JSON.stringify(err));
    })
});

app.get('*', (req, res, next) => {
    console.log('got host: ', req.host);
    console.log('got headers: ', req.headers);
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`App listening on Port: ${PORT}`);
});