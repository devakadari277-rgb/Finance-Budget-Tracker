const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class MLService {
  /**
   * 1. PREDICT: Traditional Machine Learning (Regression/Classification)
   * (Sample implementation using simple logic; real production would use TensorFlow.js or Python backend)
   */
  async predictNextMonthSavings(userId, transactionHistory) {
    console.log(`Predicting for user ${userId} using Regression model...`);
    // Basic Linear Regression Logic Sample
    if (!transactionHistory || transactionHistory.length < 2) {
      return { prediction: 0, confidence: 0.1, message: "Insufficient data for prediction" };
    }
    // Simple average-based trend prediction
    const amounts = transactionHistory.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b) / amounts.length;
    return { prediction: avg * 1.05, confidence: 0.7, model: "Linear Regression" };
  }

  /**
   * 2. NLP: Text AI (GPT-4 / BERT Simulation)
   */
  async getAIFinancialAdvice(userProfile, financialSummary) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key_here') {
      return "AI advice is currently unavailable (API key not set).";
    }
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional financial advisor AI." },
          { role: "user", content: `Based on my income of $${userProfile.income} and spending of $${userProfile.expense}, what advice do you have?` }
        ],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI Error:", error);
      return "Failed to fetch AI advice.";
    }
  }

  /**
   * 3. GENERATIVE: Image Generation (DALL-E)
   */
  async generateFinancialInfographic(topic) {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
      const response = await openai.images.generate({
        prompt: `A professional futuristic infographic showing financial growth about ${topic}`,
        n: 1,
        size: "1024x1024",
      });
      return response.data[0].url;
    } catch (error) {
      console.error("DALL-E Error:", error);
      return null;
    }
  }

  /**
   * 4. CLUSTERING: Grouping Transactions (K-Means Simulation)
   */
  async clusterTransactions(transactions) {
    // Basic logic to group by category and amount range
    const clusters = transactions.reduce((acc, t) => {
      const clusterId = t.subtype || 'unknown';
      if (!acc[clusterId]) acc[clusterId] = [];
      acc[clusterId].push(t);
      return acc;
    }, {});
    return Object.entries(clusters).map(([id, items]) => ({
      cluster_id: id,
      count: items.length,
      total_amount: items.reduce((s, i) => s + i.amount, 0)
    }));
  }
}

module.exports = new MLService();
