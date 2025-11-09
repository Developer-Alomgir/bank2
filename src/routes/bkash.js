const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { accounts, bkashLinks, transactions, notifications } = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function record(accountId, type, amount, status, meta = {}) {
  const tx = { id: uuidv4(), accountId, date: new Date().toISOString(), type, amount, status, meta };
  transactions.push(tx);
  return tx;
}

function notify(userId, type, message) {
  notifications.push({ id: uuidv4(), userId, type, message, date: new Date().toISOString(), read: false });
}

function requireLinked(userId) {
  const link = bkashLinks.find(b => b.userId === userId && b.linked);
  return link || null;
}

router.post('/link', (req, res) => {
  // This route is also available in /auth, here protected version updates for logged user
  const { mobile } = req.body;
  let link = bkashLinks.find(b => b.userId === req.user.userId);
  if (link) {
    link.mobile = mobile; link.linked = true;
  } else {
    bkashLinks.push({ userId: req.user.userId, mobile, linked: true });
  }
  res.json({ message: 'bKash linked', mobile });
});

router.post('/send', (req, res) => {
  const { fromAccountId, mobile, amount } = req.body;
  const link = requireLinked(req.user.userId);
  if (!link || link.mobile !== mobile) return res.status(400).json({ error: 'bKash not linked/verified' });
  const from = accounts.find(a => a.id === fromAccountId && a.userId === req.user.userId);
  if (!from) return res.status(404).json({ error: 'Account not found' });
  if (amount <= 0 || from.balance < amount) return res.status(400).json({ error: 'Invalid amount or insufficient funds' });
  from.balance -= amount;
  const tx = record(from.id, 'bKash Send', -amount, 'SUCCESS', { toMobile: mobile });
  notify(req.user.userId, 'Transfer', `Sent ${amount} to bKash ${mobile}`);
  res.json({ message: 'bKash send complete', transaction: tx });
});

router.post('/cashout', (req, res) => {
  const { toAccountId, amount } = req.body;
  const link = requireLinked(req.user.userId);
  if (!link) return res.status(400).json({ error: 'bKash not linked' });
  const to = accounts.find(a => a.id === toAccountId && a.userId === req.user.userId);
  if (!to) return res.status(404).json({ error: 'Account not found' });
  to.balance += amount;
  const tx = record(to.id, 'bKash CashOut', amount, 'SUCCESS', { fromMobile: link.mobile });
  notify(req.user.userId, 'Deposit', `Cash out ${amount} from bKash`);
  res.json({ message: 'bKash cash out complete', transaction: tx });
});

router.post('/recharge', (req, res) => {
  const { fromAccountId, mobile, amount } = req.body;
  const from = accounts.find(a => a.id === fromAccountId && a.userId === req.user.userId);
  if (!from) return res.status(404).json({ error: 'Account not found' });
  if (amount <= 0 || from.balance < amount) return res.status(400).json({ error: 'Invalid amount or insufficient funds' });
  from.balance -= amount;
  const tx = record(from.id, 'Mobile Recharge', -amount, 'SUCCESS', { mobile });
  notify(req.user.userId, 'Transfer', `Recharged ${mobile} by ${amount}`);
  res.json({ message: 'Recharge complete', transaction: tx });
});

router.post('/paybill', (req, res) => {
  const { fromAccountId, biller, amount } = req.body;
  const from = accounts.find(a => a.id === fromAccountId && a.userId === req.user.userId);
  if (!from) return res.status(404).json({ error: 'Account not found' });
  if (amount <= 0 || from.balance < amount) return res.status(400).json({ error: 'Invalid amount or insufficient funds' });
  from.balance -= amount;
  const tx = record(from.id, 'Pay Bill', -amount, 'SUCCESS', { biller });
  notify(req.user.userId, 'Transfer', `Paid ${biller} ${amount}`);
  res.json({ message: 'Bill payment complete', transaction: tx });
});

module.exports = router;
