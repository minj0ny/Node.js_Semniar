var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');
const upload = require('../../config/multer');
const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

router.post('/', upload.single('profileImg'), (req, res) => {
    if (!req.body.id || !req.body.name) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const userInfo = {
            id: req.body.id,
            profileImg: req.file.location,
            name: req.body.name,
            password: req.body.password,
        }

        const insertUserQuery = 'INSERT INTO user (id, name, profileImg, password) VALUES (?, ?, ?, ?)';

        pool.getConnection((err, connection) => {
            connection.query(insertUserQuery, [userInfo.id, userInfo.name, userInfo.profileImg, userInfo.password], (err, result) => {
                if (err) {
                    res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
                } else {
                    delete userInfo.password
                    res.status(200).send(util.successTrue(statusCode.OK, resMessage.CREATED_USER, userInfo));
                    connection.release();
                }
            });
        });
    }
});
module.exports = router;