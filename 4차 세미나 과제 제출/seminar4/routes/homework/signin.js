var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');
const crypto = require('crypto-promise');
const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

router.post('/', (req, res) => {
    if (!req.body.id || !req.body.password) {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const loginInfo = {
            id: req.body.id,
            password: req.body.password,
        }

        const selectWomenQuery = 'SELECT * FROM user WHERE id = ?';

        pool.getConnection((err, connection) => {
            connection.query(selectWomenQuery, [loginInfo.id], async (err, result) => {
                if (err) {
                    res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
                } else {
                    const salt = result[0].salt;
                    const hashedPW = await crypto.pbkdf2(loginInfo.password.toString(), salt.toString('base64'), 1000, 32, 'SHA512');
                    loginInfo.password = hashedPW.toString('base64');

                    if (result[0].password == loginInfo.password) {
                        loginInfo.name = result[0].name
                        delete loginInfo.password
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, loginInfo));
                        connection.release();
                    } else {
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_FAIL));
                        connection.release();
                    }
                }
            });
        });
    }
});
module.exports = router;