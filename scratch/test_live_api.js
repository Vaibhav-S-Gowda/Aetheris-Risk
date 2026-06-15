async function test() {
  const payload = {
    person_age: 35,
    person_income: 75000,
    person_emp_length: 8,
    loan_amnt: 20000,
    loan_int_rate: 11.5,
    loan_percent_income: 0.27,
    person_home_ownership: 'MORTGAGE',
    loan_intent: 'EDUCATION',
    loan_grade: 'B',
    cb_person_default_on_file: 'N',
    country: 'USA',
    hyperparameters: {
      n_estimators: 10,
      max_depth: 3,
      min_samples_split: 5
    }
  };

  try {
    const res = await fetch('https://aetheris-risk.onrender.com/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

test();
