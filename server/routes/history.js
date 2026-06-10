/**
 * routes/history.js – Evaluation history CRUD.
 */
const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Evaluation = require('../models/Evaluation');

// GET /api/history – last 50 evaluations, newest first
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected. Returning empty history.');
      return res.json([]);
    }
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const records = await Evaluation.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id – remove a single evaluation record
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    const deleted = await Evaluation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Record not found' });
    res.json({ success: true, deleted: deleted._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history – clear all history
router.delete('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    await Evaluation.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
