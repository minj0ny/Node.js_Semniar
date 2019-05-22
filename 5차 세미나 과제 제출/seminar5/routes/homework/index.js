var express = require('express');
var router = express.Router();

router.use('/news', require('./news'));
router.use('/contents', require('./contents'));

module.exports = router;