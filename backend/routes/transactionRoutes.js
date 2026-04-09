const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.post('/', auth, transactionController.addTransaction);
router.get('/history', auth, transactionController.getHistory);
router.get('/analytics', auth, transactionController.getAnalytics);

module.exports = router;
