var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
var json2csv = require('async-json2csv');
var csv = require("csvtojson");
const fs = require("fs");

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

router.get('/:id', (req, res) => {

    csv().fromFile('studentInfo.csv').then((studentData) => {
        for (var i = 0; i < studentData.length; i++) {
            if (studentData[i].id == req.params.id) {
                break;
            }
        }

        if (i < studentData.length) {
            //만약 있는 경우 나이와 솔트값은 JSON 객체에서 삭제하고 response 전송
            delete studentData[i].age;
            delete studentData[i].salt;
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.STUDENT_SELECT_SUCCESS, studentData[i]));
        } else {
            res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_STUDENT));
        }
    }, (message) => {
        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, message));
    });

});
//localhost:3000/training/info
router.post('/', async (req, res) => {
    //body = { "id": 201634008, "name":"심민정", "univ": "성공회대", "major": "글로컬 IT 학과", "age": 23}

    if (!req.body.id || !req.body.name) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const stuInfo = {
            id: req.body.id,
            name: req.body.name,
            univ: req.body.univ,
            major: req.body.major,
            age: req.body.age
        }

        try {
            const salt = await crypto.randomBytes(32);
            const hashedAge = await crypto.pbkdf2(stuInfo.age.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

            stuInfo.salt = salt.toString('base64');
            stuInfo.age = hashedAge.toString('base64');

            const options = {
                data: [stuInfo],
                fields: ['id', 'name', 'univ', 'major', 'age', 'salt'],
                header: true
            }

            const stuInfoCsv = await json2csv(options);
            fs.appendFileSync('studentInfo.csv', stuInfoCsv, "UTF-8", {
                'flags': 'a+'
            });
            res.status(200).send(util.successTrue(statusCode.CREATED, resMessage.SAVE_SUCCESS));
        } catch (err) {

            res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
        }
    }
});

module.exports = router;