const express = require('express');
const router = express.Router();
const { sendFeedback } = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authmiddleware');

router.post('/', authMiddleware, sendFeedback);

module.exports = router;
