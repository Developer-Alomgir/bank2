const express = require('express');
const { accounts, transactions } = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Accounts list for logged user
router.get('/', (req, res) => {
  const userAccounts = accounts.filter(a => a.userId === req.user.userId);
  res.json({ accounts: userAccounts });
});

// Account details
router.get('/:id', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id && a.userId === req.user.userId);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json({ account });
});

// Transactions for an account
router.get('/:id/transactions', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id && a.userId === req.user.userId);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const tx = transactions.filter(t => t.accountId === account.id);
  res.json({ transactions: tx });
});

module.exports = router;
