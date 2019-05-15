var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');

const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

router.get('/:gender', (req, res) => {

    const selectWomenQuery = 'SELECT * FROM membership WHERE gender = ?';

    pool.getConnection((err, connection) => {
        connection.query(selectWomenQuery, [req.params.gender], (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                connection.release();
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.STUDENT_SELECT_SUCCESS, result));
            }
        });

    });
});
module.exports = router;