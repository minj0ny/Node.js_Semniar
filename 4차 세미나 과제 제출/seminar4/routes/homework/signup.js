var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');
const crypto = require('crypto-promise');
const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

router.post('/', async (req, res) => {
    if (!req.body.id || !req.body.name) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const userInfo = {
            id: req.body.id,
            name: req.body.name,
            password: req.body.password,
        }
        const salt = await crypto.randomBytes(32);
        const hashedPW = await crypto.pbkdf2(userInfo.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

        userInfo.salt = salt.toString('base64');
        userInfo.password = hashedPW.toString('base64');

        const selectWomenQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection((err, connection) => {
            connection.query(selectWomenQuery, [userInfo.id], (err, result) => {
                if (err) {
                    res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
                } else {
                    if (result[0] == null) {

                        const insertUserQuery = 'INSERT INTO user (id, name, password, salt) VALUES (?, ?, ?, ?)';

                        connection.query(insertUserQuery, [userInfo.id, userInfo.name, userInfo.password, userInfo.salt], (err, result) => {
                            if (err) {
                                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
                            } else {
                                delete userInfo.password
                                delete userInfo.salt
                                res.status(200).send(util.successTrue(statusCode.OK, resMessage.CREATED_USER, userInfo));
                                connection.release();
                            }
                        });
                    } else {
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.ALREADY_USER));
                        connection.release();
                    }
                }
            });
        });
    }
});
module.exports = router;