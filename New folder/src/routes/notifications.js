const express = require('express');
const { notifications } = require('../data/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const list = notifications.filter(n => n.userId === req.user.userId);
  res.json({ notifications: list });
});

router.post('/:id/read', (req, res) => {
  const n = notifications.find(x => x.id === req.params.id && x.userId === req.user.userId);
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.read = true;
  res.json({ message: 'Marked as read' });
});

module.exports = router;
