const express = require('express');
const { getDashboardSummary } = require('../controller/dashboard.controller');

const router = express.Router();

router.get('/summary', getDashboardSummary);

module.exports = router;
