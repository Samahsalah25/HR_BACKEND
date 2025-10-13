const SystemSettings = require("../models/systemSettingsSchema");

// جلب حالة الإعداد
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching system settings" });
  }
};

// تحديث حالة الإعداد
const updateSystemSettings = async (req, res) => {
  try {
    const { isSetupComplete, steps } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();

    if (isSetupComplete !== undefined) settings.isSetupComplete = isSetupComplete;
    if (steps) settings.steps = { ...settings.steps, ...steps };

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating system settings" });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings
};
