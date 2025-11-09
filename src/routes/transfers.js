const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { users, accounts, transactions, beneficiaries, notifications } = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function addTransaction(accountId, type, amount, status, meta = {}) {
  const tx = { id: uuidv4(), accountId, date: new Date().toISOString(), type, amount, status, meta };
  transactions.push(tx);
  return tx;
}

function notify(userId, type, message) {
  notifications.push({ id: uuidv4(), userId, type, message, date: new Date().toISOString(), read: false });
}

// Add beneficiary
router.post('/beneficiaries', (req, res) => {
  const { name, accountNumber } = req.body;
  if (!name || !accountNumber) return res.status(400).json({ error: 'Missing fields' });
  beneficiaries.push({ id: uuidv4(), ownerUserId: req.user.userId, name, accountNumber });
  res.json({ message: 'Beneficiary added' });
});

// List beneficiaries
router.get('/beneficiaries', (req, res) => {
  const list = beneficiaries.filter(b => b.ownerUserId === req.user.userId);
  res.json({ beneficiaries: list });
});

// Internal transfer (between user accounts)
router.post('/internal', (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  const from = accounts.find(a => a.id === fromAccountId && a.userId === req.user.userId);
  const to = accounts.find(a => a.id === toAccountId && a.userId === req.user.userId);
  if (!from || !to) return res.status(400).json({ error: 'Invalid accounts' });
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (from.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });
  from.balance -= amount;
  to.balance += amount;
  const tx1 = addTransaction(from.id, 'Transfer', -amount, 'SUCCESS', { toAccountId: to.id });
  const tx2 = addTransaction(to.id, 'Transfer', amount, 'SUCCESS', { fromAccountId: from.id });
  notify(req.user.userId, 'Transfer', `Internal transfer of ${amount} completed`);
  res.json({ message: 'Internal transfer complete', transactions: [tx1, tx2] });
});

// Bank-to-bank transfer (to another user in same bank)
router.post('/bank', (req, res) => {
  const { fromAccountId, toAccountNumber, amount } = req.body;
  const from = accounts.find(a => a.id === fromAccountId && a.userId === req.user.userId);
  const to = accounts.find(a => a.number === toAccountNumber);
  if (!from || !to) return res.status(400).json({ error: 'Invalid accounts' });
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (from.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });
  from.balance -= amount;
  to.balance += amount;
  const tx1 = addTransaction(from.id, 'Transfer', -amount, 'SUCCESS', { toAccountId: to.id });
  const tx2 = addTransaction(to.id, 'Transfer', amount, 'SUCCESS', { fromAccountId: from.id });
  notify(req.user.userId, 'Transfer', `Transfer of ${amount} to ${to.number} completed`);
  notify(to.userId, 'Deposit', `Received ${amount} from ${from.number}`);
  res.json({ message: 'Bank transfer complete', transactions: [tx1, tx2] });
});

module.exports = router;
