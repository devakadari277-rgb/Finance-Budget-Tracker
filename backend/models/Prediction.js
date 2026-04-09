const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  model_type: { type: String, required: true }, // e.g., 'regression', 'classification', 'nlp'
  input_data: { type: mongoose.Schema.Types.Mixed },
  output_result: { type: mongoose.Schema.Types.Mixed },
  api_used: { type: String }, // e.g., 'OpenAI', 'Local', 'Google Cloud'
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
