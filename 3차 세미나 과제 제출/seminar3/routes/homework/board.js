var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
var json2csv = require('async-json2csv');
var csv = require("csvtojson");
const fs = require("fs");
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');


router.get('/:id', (req, res) => {

    csv().fromFile('blog.csv').then((blogData) => {
        for (var i = 0; i < blogData.length; i++) {
            if (blogData[i].id == req.params.id) {
                break;
            }
        }

        if (i < blogData.length) {
            delete blogData[i].password;
            delete blogData[i].salt;
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_SELECT_SUCCESS, blogData[i]));
        } else {
            res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_BOARD));
        }
    }, (message) => {
        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
    });

});
//localhost:3000/homework/board ->POST
router.post('/', async (req, res) => {
    //body = { "id": 1, "title":"오늘 먹은 것", "content": "맘스터치~", "password": "minjung4601"}
    var date = moment().format('YYYY-MM-DD HH:mm:ss');

    const blogInfo = {
        id: req.body.id,
        title: req.body.title,
        content: req.body.content,
        password: req.body.password
    }

    try {

        const salt = await crypto.randomBytes(32);
        const hashedPassword = await crypto.pbkdf2(blogInfo.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

        blogInfo.salt = salt.toString('base64');
        blogInfo.password = hashedPassword.toString('base64');
        blogInfo.time = date;

        const options = {
            data: [blogInfo],
            fields: ['id', 'title', 'content', 'password', 'salt', 'time'],
            header: true,
        }
        var exist = false;
        if (fs.existsSync('blog.csv')) {
            csv().fromFile('blog.csv').then(async (blogData) => {
                for (var i = 0; i < blogData.length; i++) {
                    if (blogData[i].title == blogInfo.title) {
                        exist = true;
                        continue;
                    }
                    options.data.push(blogData[i]);
                }
                if (exist == true) {
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.BOARD_ALREADY_EXISTS));
                } else {
                    var blogCsv = await json2csv(options);
                    fs.writeFileSync('blog.csv', blogCsv);
                    res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
                }
            }, (message) => {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
            });
        } else {
            var blogCsv = await json2csv(options);
            fs.writeFileSync('blog.csv', blogCsv);
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        }
    } catch (err) {
        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
    }
});
//localhost:3000/homework/board ->PUT
router.put('/', async (req, res) => {
    //body = { "id": 1, "title":"오늘 먹은 것", "content": "맘스터치~", "password": "minjung4601"}
    var date = moment().format('YYYY-MM-DD HH:mm:ss');

    const blogInfo = {
        id: req.body.id,
        title: req.body.title,
        content: req.body.content,
        password: req.body.password
    }

    try {

        const options = {
            data: [blogInfo],
            fields: ['id', 'title', 'content', 'password', 'salt', 'time'],
            header: true,
        }
        var exist = false;
        var miss_match_pw = false;
        if (fs.existsSync('blog.csv')) {
            csv().fromFile('blog.csv').then(async (blogData) => {
                for (var i = 0; i < blogData.length; i++) {
                    if (blogData[i].id == blogInfo.id) {

                        const salt = blogData[i].salt;
                        const hashedPassword = await crypto.pbkdf2(blogInfo.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

                        blogInfo.salt = salt.toString('base64');
                        blogInfo.password = hashedPassword.toString('base64');
                        blogInfo.time = date;

                        if (blogData[i].password == blogInfo.password) {
                            delete blogData[i];
                            exist = true;
                            continue;
                        } else {
                            miss_match_pw = true;
                        }
                    }
                    options.data.push(blogData[i]);
                }
                if (miss_match_pw == true) {
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.MISS_MATCH_PW));
                } else if (exist == false) {
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_BOARD));
                } else {
                    var blogCsv = await json2csv(options);
                    fs.writeFileSync('blog.csv', blogCsv);
                    res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
                }
            }, (message) => {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
            });
        } else {
            var blogCsv = await json2csv(options);
            fs.writeFileSync('blog.csv', blogCsv);
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        }
    } catch (err) {
        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
    }
});
//localhost:3000/homework/board ->DELETE
router.delete('/', async (req, res) => {
    //body = { "id": 1, "password": "minjung4601"}
    var date = moment().format('YYYY-MM-DD HH:mm:ss');

    const blogInfo = {
        id: req.body.id,
        password: req.body.password
    }

    try {

        const options = {
            data: [],
            fields: ['id', 'title', 'content', 'password', 'salt', 'time'],
            header: true,
        }

        var exist = false;
        var miss_match_pw = false;
        if (fs.existsSync('blog.csv')) {
            csv().fromFile('blog.csv').then(async (blogData) => {
                for (var i = 0; i < blogData.length; i++) {
                    if (blogData[i].id == blogInfo.id) {

                        const salt = blogData[i].salt;
                        const hashedPassword = await crypto.pbkdf2(blogInfo.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

                        blogInfo.salt = salt.toString('base64');
                        blogInfo.password = hashedPassword.toString('base64');
                        blogInfo.time = date;

                        if (blogData[i].password == blogInfo.password) {
                            delete blogData[i];
                            exist = true;
                            continue;
                        } else {
                            miss_match_pw = true;
                        }
                    }
                    options.data.push(blogData[i]);
                }
                if (miss_match_pw == true) {
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.MISS_MATCH_PW));
                } else if (exist == false) {
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_BOARD));
                } else {
                    var blogCsv = await json2csv(options);
                    fs.writeFileSync('blog.csv', blogCsv);
                    res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
                }
            }, (message) => {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
            });
        } else {
            var blogCsv = await json2csv(options);
            fs.writeFileSync('blog.csv', blogCsv);
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        }
    } catch (err) {
        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
    }
});

module.exports = router;