var express = require('express');
var router = express.Router();

router.use('/membership', require('./membership'));

module.exports = router;