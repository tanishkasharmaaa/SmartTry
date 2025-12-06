const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      "refund",
      "return",
      "offer",
      "shipping",
      "cancellation",
      "terms",
      "privacy",
      "general"
    ],
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  // Optional: for rules that have time limits (refunds, returns etc.)
  daysAllowed: {
    type: Number
  },

  priority: {
    type: Number,
    default: 1   // higher priority → show first
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const rulesModel = mongoose.model("Rule", ruleSchema);

module.exports = rulesModel
