const express = require('express');
const router = express.Router();
const { sendFeedback } = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, sendFeedback);

module.exports = router;
