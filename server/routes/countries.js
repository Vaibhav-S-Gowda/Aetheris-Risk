/**
 * routes/countries.js – Returns the list of countries with ESG data.
 */
const express = require('express');
const router  = express.Router();
const esgData = require('../data/country_esg_data.json');

// GET /api/countries
// Returns minimal country list (iso3, country name) for the dropdown
router.get('/', (req, res) => {
  const list = esgData.map(({ iso3, country }) => ({ iso3, country }));
  list.sort((a, b) => a.country.localeCompare(b.country));
  res.json(list);
});

// GET /api/countries/:iso3 – Full ESG profile for a single country
router.get('/:iso3', (req, res) => {
  const record = esgData.find(c => c.iso3 === req.params.iso3.toUpperCase());
  if (!record) return res.status(404).json({ error: 'Country not found' });
  res.json(record);
});

module.exports = router;
