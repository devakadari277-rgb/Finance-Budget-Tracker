const Transaction = require('../models/Transaction');
const mlService = require('../services/mlService');

exports.addTransaction = async (req, res) => {
  try {
    const transaction = new Transaction({ ...req.body, user_id: req.user.id });
    await transaction.save();
    res.status(201).json({ status: 'ok', transaction });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { user_id: req.user.id };
    if (year) {
      const start = new Date(year, (month || 1) - 1, 1);
      const end = new Date(year, (month || 12), 0);
      query.date = { $gte: start, $lte: end };
    }
    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json({ status: 'ok', transactions });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user.id });
    const clusters = await mlService.clusterTransactions(transactions);
    const prediction = await mlService.predictNextMonthSavings(req.user.id, transactions);
    
    res.json({ status: 'ok', analytics: { clusters, prediction } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
