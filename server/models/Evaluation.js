const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  // Input snapshot
  inputs: {
    person_age: Number,
    person_income: Number,
    person_emp_length: Number,
    loan_amnt: Number,
    loan_int_rate: Number,
    loan_percent_income: Number,
    person_home_ownership: String,
    loan_intent: String,
    loan_grade: String,
    cb_person_default_on_file: String,
    country: String,
  },
  // Prediction results
  risk_probability: Number,      // 0-1 from RF model
  risk_label: String,            // 'Low', 'Medium', 'High'
  esg_score: Number,             // 0-1 composite ESG score for selected country
  composite_score: Number,       // final weighted score
  esg_details: {
    renewable_energy: Number,
    access_electricity: Number,
    corruption_control: Number,
    political_stability: Number,
    rule_of_law: Number,
    forest_area: Number,
    fossil_fuel: Number,
    ghg_per_capita: Number,
    unemployment: Number,
    pm25: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
