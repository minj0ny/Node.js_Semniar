var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');
const upload = require('../../config/multer');
const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.post('/', upload.array('imgs'), (req, res) => {
    const imgs = req.files;

    const insertContentsInfoQuery = 'INSERT INTO contents (content, contentImg, newsIdx) VALUES ?';

    let values = [];

    for (let i = 0; i < imgs.length; i++) {
        values.push([req.body.content[i], imgs[i].location, req.body.newsIdx]);
    }
    pool.getConnection((err, connection) => {
        connection.query(insertContentsInfoQuery, [values], (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS, result));
                connection.release();
            }
        });
    });
});
module.exports = router;