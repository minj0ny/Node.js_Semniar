var express = require('express');
var router = express.Router();
const pool = require('../../config/dbConfig');
const crypto = require('crypto-promise');
const util = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/:idx', (req, res) => {

    const selectWomenQuery = 'SELECT * FROM board WHERE boardIdx = ?';

    pool.getConnection((err, connection) => {
        connection.query(selectWomenQuery, [req.params.idx], (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.READ_FAIL));
            } else {
                delete result[0].boardPW;
                delete result[0].salt;

                connection.release();
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_SELECT_SUCCESS, result));
            }
        });
    });
});

router.get('/', (req, res) => {

    const selectWomenQuery = 'SELECT * FROM board';

    pool.getConnection((err, connection) => {
        connection.query(selectWomenQuery, (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.READ_FAIL));
            } else {
                for (var i = 0; i < result.length; i++) {
                    delete result[i].boardPW;
                    delete result[i].salt;
                }

                connection.release();
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_SELECT_SUCCESS, result));
            }
        });
    });
});

router.post('/', async (req, res) => {

    var date = moment().format('YYYY-MM-DD HH:mm:ss');

    const boardInfo = {
        title: req.body.title,
        content: req.body.content,
        boardPW: req.body.boardPW,
        writer: req.body.writer
    }

    const salt = await crypto.randomBytes(32);
    const hashedBoardPW = await crypto.pbkdf2(boardInfo.boardPW.toString(), salt.toString('base64'), 1000, 32, 'SHA512');

    boardInfo.salt = salt.toString('base64');
    boardInfo.boardPW = hashedBoardPW.toString('base64');
    boardInfo.time = date;

    pool.getConnection((err, connection) => {
        const insertBoardQuery = 'INSERT INTO board (title, content, writer, writetime, boardPW, salt) VALUES (?, ?, ?, ?, ?, ?)';

        connection.query(insertBoardQuery, [boardInfo.title, boardInfo.content, boardInfo.writer, boardInfo.time, boardInfo.boardPW, boardInfo.salt], (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.SAVE_FAIL));
            } else {
                delete boardInfo.boardPW;
                delete boardInfo.salt;

                connection.release();
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.SAVE_SUCCESS, boardInfo));
            }
        });
    });
});

router.delete('/', async (req, res) => {
    const selectWomenQuery = 'SELECT * FROM board WHERE boardIdx = ?';

    const boardDelete = {
        boardIdx: req.body.boardIdx,
        boardPW: req.body.boardPW,
    }
    pool.getConnection((err, connection) => {
        connection.query(selectWomenQuery, [boardDelete.boardIdx], async (err, result) => {
            if (err) {
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.READ_FAIL));
            } else {
                if (result[0] == null) {
                    res.status(200).send(util.successTrue(statusCode.OK, resMessage.NO_BOARD));
                } else {
                    const salt = result[0].salt;
                    const hashedPW = await crypto.pbkdf2(boardDelete.boardPW.toString(), salt.toString('base64'), 1000, 32, 'SHA512');
                    boardDelete.boardPW = hashedPW.toString('base64');

                    if (result[0].boardPW == boardDelete.boardPW) {
                        const deleteBoardQuery = 'DELETE FROM board WHERE boardIdx = ?';

                        pool.getConnection((err, connection) => {
                            connection.query(deleteBoardQuery, [boardDelete.boardIdx], async (err, result) => {
                                if (err) {
                                    res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.READ_FAIL));
                                } else {
                                    res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_DELETE_SUCCESS));
                                    connection.release();
                                }
                            });
                        });
                    } else {
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.MISS_MATCH_PW));
                    }
                }
            }
        });
    });
});
module.exports = router;