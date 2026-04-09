const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ status: 'error', message: 'Email already registered' });

    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ status: 'ok', user_id: user._id });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ status: 'ok', token, user_id: user._id });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ status: 'ok', user });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
