const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  isSetupComplete: {
    type: Boolean,
    default: false
  },
  steps: {
    branches: { type: Boolean, default: false },
    departments: { type: Boolean, default: false },
    contracts: { type: Boolean, default: false },
    leaves: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
