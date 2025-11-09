const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users, accounts, bkashLinks } = require('../data/store');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { fullName, phone, email, password, pin } = req.body;
  if (!fullName || !phone || !email || !password || !pin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const pinHash = await bcrypt.hash(String(pin), 10);
  const user = { id: uuidv4(), fullName, phone, email, passwordHash, pinHash, twoFAEnabled: false, twoFACode: null };
  users.push(user);
  // Create a default savings account
  const account = { id: uuidv4(), userId: user.id, number: String(Math.floor(100000000 + Math.random() * 900000000)), type: 'Savings', balance: 0 };
  accounts.push(account);
  return res.json({ message: 'Registered', user: { id: user.id, fullName, phone, email }, account });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  // If 2FA enabled, generate code and require verification
  if (user.twoFAEnabled) {
    user.twoFACode = String(Math.floor(100000 + Math.random() * 900000));
    return res.json({ twoFARequired: true, message: '2FA code sent (mocked)', code: user.twoFACode });
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Verify 2FA
router.post('/2fa/verify', (req, res) => {
  const { email, code } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !user.twoFAEnabled) return res.status(400).json({ error: '2FA not enabled' });
  if (user.twoFACode !== code) return res.status(401).json({ error: 'Invalid 2FA code' });
  user.twoFACode = null;
  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Enable 2FA
router.post('/2fa/enable', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.twoFAEnabled = true;
  res.json({ message: '2FA enabled' });
});

// Reset PIN (mock)
router.post('/pin/reset', async (req, res) => {
  const { email, newPin } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.pinHash = await bcrypt.hash(String(newPin), 10);
  res.json({ message: 'PIN updated' });
});

// Link bKash account (store mobile)
router.post('/bkash/link', (req, res) => {
  const { email, mobile } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const existing = bkashLinks.find(b => b.userId === user.id);
  if (existing) {
    existing.mobile = mobile;
    existing.linked = true;
  } else {
    bkashLinks.push({ userId: user.id, mobile, linked: true });
  }
  res.json({ message: 'bKash linked', mobile });
});

module.exports = router;
