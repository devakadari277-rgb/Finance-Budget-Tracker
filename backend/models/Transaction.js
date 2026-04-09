const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense', 'saving'], required: true },
  subtype: { type: String, required: true }, // category or source
  date: { type: Date, required: true },
  time: { type: String },
  description: { type: String },
  payment_mode: { type: String, default: 'cash' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
