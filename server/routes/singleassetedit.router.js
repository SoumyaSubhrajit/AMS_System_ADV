const express = require('express');
const router = express.Router();
const { editAll } = require('../controller/singleassetedit.controller');


router.put('/edit/:id', editAll);

module.exports = router;
