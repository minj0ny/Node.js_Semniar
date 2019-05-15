const mysql = require('mysql');
const config = {
    host: 'soptserver.cbspdyahhen8.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'minjony1014',
    password: '1a2w3e4r!!',
    database: 'seminar4',
}
module.exports = mysql.createPool(config);