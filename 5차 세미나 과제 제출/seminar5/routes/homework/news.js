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

router.post('/', upload.single('thumbnail'), (req, res) => {
    var date = moment().format('YYYY-MM-DD HH:mm:ss');

    const news = {
        title: req.body.title,
        writer: req.body.writer,
        thumbnail: req.file.location,
        writetime: date,
    }

    const insertNewsQuery = 'INSERT INTO news (title, writer, thumbnail, writetime) VALUES (?, ?, ?, ?)';

    pool.getConnection((err, connection) => {
        connection.query(insertNewsQuery, [news.title, news.writer, news.thumbnail, news.writetime], (err, newsResult) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS, newsResult));
                connection.release();
            }
        });
    });
});

router.get('/:idx', (req, res) => {

    const selectNewsQuery = 'SELECT * FROM news WHERE newsIdx = ?';

    pool.getConnection((err, connection) => {
        connection.query(selectNewsQuery, [req.params.idx], (err, newsResult) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                delete newsResult[0].thumbnail;
                const selectContentsQuery = 'SELECT * FROM contents WHERE newsIdx = ?'
                connection.query(selectContentsQuery, [req.params.idx], (err, contentsResult) => {
                    if (err) {
                        res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
                    } else {
                        contentsResult.every((item) => {
                            return delete item.contentIdx;
                        });
                        delete contentsResult.contentIdx;
                        const result = [newsResult, contentsResult]
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.NEWS_SELECT_SUCCESS, result));
                        connection.release();
                    }
                });
            }
        });
    });
});

router.get('/', (req, res) => {

    const selectNewsQuery = 'SELECT * FROM news ORDER BY writetime desc';

    pool.getConnection((err, connection) => {
        connection.query(selectNewsQuery, (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.NEWS_SELECT_SUCCESS, result));
                connection.release();
            }
        });
    });
});
module.exports = router;