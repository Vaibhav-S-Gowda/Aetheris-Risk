/**
 * routes/evaluate.js – Core risk evaluation endpoint.
 *
 * POST /api/evaluate
 *   Body: { person_age, person_income, ... , country (ISO3) }
 *   Returns: risk score, label, ESG data, composite score
 */
const express   = require('express');
const router    = express.Router();
const { predict } = require('../lib/predictor');
const Evaluation  = require('../models/Evaluation');
const esgData     = require('../data/country_esg_data.json');

// Build a lookup map for O(1) country retrieval
const esgMap = Object.fromEntries(esgData.map(c => [c.iso3, c]));

// Thresholds for risk labelling
function riskLabel(probability) {
  if (probability < 0.35) return 'Low';
  if (probability < 0.65) return 'Medium';
  return 'High';
}

router.post('/', async (req, res) => {
  try {
    const {
      person_age, person_income, person_emp_length,
      loan_amnt, loan_int_rate, loan_percent_income,
      person_home_ownership, loan_intent, loan_grade,
      cb_person_default_on_file, country,
    } = req.body;

    const mlInput = {
      person_age, person_income, person_emp_length,
      loan_amnt, loan_int_rate, loan_percent_income,
      person_home_ownership, loan_intent, loan_grade,
      cb_person_default_on_file,
    };

    // ── ML Prediction & Outlier Check ─────────────────────────
    let risk_probability;
    if (loan_percent_income > 0.85) {
      // Hard override: If loan-to-income ratio is above the training threshold (0.85),
      // it is an automatic default risk (100%).
      risk_probability = 1.0;
    } else {
      risk_probability = await predict(mlInput);
    }
    const label = riskLabel(risk_probability);

    // ── ESG Context ────────────────────────────────────────────
    const countryRecord = esgMap[country?.toUpperCase()] || null;
    const esg_score     = countryRecord ? countryRecord.esg_score : 0.5;

    // Composite: 70% ML credit risk + 30% ESG penalty
    // High ESG score reduces overall risk; low ESG score amplifies it
    const esgPenalty   = 1 - esg_score;          // 0 = best, 1 = worst
    const composite    = (0.70 * risk_probability) + (0.30 * esgPenalty);

    const esg_details = countryRecord ? {
      renewable_energy:    countryRecord.renewable_energy,
      access_electricity:  countryRecord.access_electricity,
      corruption_control:  countryRecord.corruption_control,
      political_stability: countryRecord.political_stability,
      rule_of_law:         countryRecord.rule_of_law,
      forest_area:         countryRecord.forest_area,
      fossil_fuel:         countryRecord.fossil_fuel,
      ghg_per_capita:      countryRecord.ghg_per_capita,
      unemployment:        countryRecord.unemployment,
      pm25:                countryRecord.pm25,
    } : {};

    // ── Persist to MongoDB ─────────────────────────────────────
    const evaluation = await Evaluation.create({
      inputs: { ...mlInput, country },
      risk_probability,
      risk_label: label,
      esg_score,
      composite_score: composite,
      esg_details,
    });

    res.json({
      id: evaluation._id,
      risk_probability,
      risk_label: label,
      esg_score,
      composite_score: composite,
      composite_label: riskLabel(composite),
      esg_details,
      country: countryRecord ? countryRecord.country : country,
      createdAt: evaluation.createdAt,
      inputs: {
        person_income: person_income,
        loan_amnt: loan_amnt,
        loan_int_rate: loan_int_rate,
        person_age: person_age,
        person_emp_length: person_emp_length,
        loan_grade: loan_grade,
        loan_intent: loan_intent,
        person_home_ownership: person_home_ownership,
        cb_person_default_on_file: cb_person_default_on_file,
        country: country,
      },
    });


  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
