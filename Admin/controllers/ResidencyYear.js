const ResidencyYear = require('../models/ResidencyYear');

exports.createResidencyYear = async (req, res) => {
  try {
    const { year } = req.body;
    const exists = await ResidencyYear.findOne({ year });
    if (exists) return res.status(400).json({ message: 'Residency year already exists' });

    const newYear = await ResidencyYear.create({ year });
    res.status(201).json(newYear);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResidencyYears = async (req, res) => {
  try {
    const years = await ResidencyYear.find();
    res.json(years);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
