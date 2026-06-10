/**
 * RiskForm.jsx – Financial inputs form.
 *
 * Manages form state and dispatches evaluate() on submission.
 */
import { useState, useEffect } from 'react';
import { fetchCountries } from '../api';

const HOME_OWNERSHIP_OPTIONS = ['RENT', 'OWN', 'MORTGAGE', 'OTHER'];
const LOAN_INTENT_OPTIONS     = ['PERSONAL', 'EDUCATION', 'MEDICAL', 'VENTURE', 'HOMEIMPROVEMENT', 'DEBTCONSOLIDATION'];
const LOAN_GRADE_OPTIONS      = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const DEFAULT_OPTIONS         = ['Y', 'N'];

// ── Currency map (ISO3 → { symbol, code }) ──────────────────────────────────
const CURRENCY_MAP = {
  USA: { symbol: '$',    code: 'USD' }, CAN: { symbol: 'CA$',  code: 'CAD' },
  GBR: { symbol: '£',   code: 'GBP' }, CHE: { symbol: 'Fr',   code: 'CHF' },
  NOR: { symbol: 'kr',  code: 'NOK' }, SWE: { symbol: 'kr',   code: 'SEK' },
  DNK: { symbol: 'kr',  code: 'DKK' }, ISL: { symbol: 'kr',   code: 'ISK' },
  AUS: { symbol: 'A$',  code: 'AUD' }, NZL: { symbol: 'NZ$',  code: 'NZD' },
  JPN: { symbol: '¥',   code: 'JPY' }, CHN: { symbol: '¥',    code: 'CNY' },
  IND: { symbol: '₹',   code: 'INR' }, BRA: { symbol: 'R$',   code: 'BRL' },
  MEX: { symbol: 'MX$', code: 'MXN' }, ARG: { symbol: 'AR$',  code: 'ARS' },
  CHL: { symbol: 'CL$', code: 'CLP' }, COL: { symbol: 'CO$',  code: 'COP' },
  PER: { symbol: 'S/',  code: 'PEN' }, ZAF: { symbol: 'R',    code: 'ZAR' },
  NGA: { symbol: '₦',   code: 'NGN' }, KEN: { symbol: 'KSh',  code: 'KES' },
  ETH: { symbol: 'Br',  code: 'ETB' }, EGY: { symbol: 'E£',   code: 'EGP' },
  GHA: { symbol: 'GH₵', code: 'GHS' }, RUS: { symbol: '₽',    code: 'RUB' },
  TUR: { symbol: '₺',   code: 'TRY' }, POL: { symbol: 'zł',   code: 'PLN' },
  CZE: { symbol: 'Kč',  code: 'CZK' }, HUN: { symbol: 'Ft',   code: 'HUF' },
  ROU: { symbol: 'lei', code: 'RON' }, BGR: { symbol: 'лв',   code: 'BGN' },
  SRB: { symbol: 'din', code: 'RSD' }, UKR: { symbol: '₴',    code: 'UAH' },
  KOR: { symbol: '₩',   code: 'KRW' }, SGP: { symbol: 'S$',   code: 'SGD' },
  HKG: { symbol: 'HK$', code: 'HKD' }, TWN: { symbol: 'NT$',  code: 'TWD' },
  THA: { symbol: '฿',   code: 'THB' }, IDN: { symbol: 'Rp',   code: 'IDR' },
  MYS: { symbol: 'RM',  code: 'MYR' }, PHL: { symbol: '₱',    code: 'PHP' },
  VNM: { symbol: '₫',   code: 'VND' }, BGD: { symbol: '৳',    code: 'BDT' },
  PAK: { symbol: '₨',   code: 'PKR' }, LKA: { symbol: 'Rs',   code: 'LKR' },
  SAU: { symbol: 'SR',  code: 'SAR' }, ARE: { symbol: 'AED',   code: 'AED' },
  QAT: { symbol: 'QR',  code: 'QAR' }, KWT: { symbol: 'KD',   code: 'KWT' },
  ISR: { symbol: '₪',   code: 'ILS' }, MAR: { symbol: 'MAD',  code: 'MAD' },
  // Euro-zone countries all map to EUR
  ...Object.fromEntries(
    ['DEU','FRA','ITA','ESP','NLD','BEL','AUT','PRT','GRC','FIN',
     'IRL','SVK','SVN','EST','LVA','LTU','LUX','MLT','CYP','HRV'].map(
      iso3 => [iso3, { symbol: '€', code: 'EUR' }]
    )
  ),
};

const DEFAULT_FORM = {
  person_age: '',
  person_income: '',
  person_emp_length: '',
  loan_amnt: '',
  loan_int_rate: '',
  loan_percent_income: '',
  person_home_ownership: 'RENT',
  loan_intent: 'PERSONAL',
  loan_grade: 'C',
  cb_person_default_on_file: 'N',
  country: 'USA',
};

export default function RiskForm({ onSubmit, loading, initialData }) {
  const [form, setForm]         = useState(() => {
    try {
      const saved = localStorage.getItem('aetheris_form_state');
      return saved ? JSON.parse(saved) : DEFAULT_FORM;
    } catch {
      return DEFAULT_FORM;
    }
  });
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    localStorage.setItem('aetheris_form_state', JSON.stringify(form));
  }, [form]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleFillDemo = () => {
    if (countries.length === 0) return;

    // Pick a random country record
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    const iso = randomCountry.iso3;

    // Define currency scaling based on ISO3
    let minIncome = 30000;
    let maxIncome = 150000;
    let minLoan = 5000;
    let maxLoan = 50000;

    if (iso === 'IND' || iso === 'PAK' || iso === 'LKA' || iso === 'BGD') {
      minIncome = 300000;
      maxIncome = 2500000;
      minLoan = 50000;
      maxLoan = 800000;
    } else if (iso === 'JPN' || iso === 'KOR' || iso === 'VNM' || iso === 'IDN') {
      minIncome = 3000000;
      maxIncome = 20000000;
      minLoan = 500000;
      maxLoan = 6000000;
    } else if (['USA', 'CAN', 'GBR', 'AUS', 'NZL', 'CHE', 'NOR', 'SWE', 'DNK', 'DEU', 'FRA', 'ITA', 'ESP', 'NLD'].includes(iso)) {
      minIncome = 45000;
      maxIncome = 180000;
      minLoan = 5000;
      maxLoan = 65000;
    }

    const age = Math.floor(Math.random() * 40) + 21; // 21 to 60
    const maxEmp = Math.min(age - 18, 25);
    const empLength = Math.max(0, Math.floor(Math.random() * (maxEmp + 1)));

    const income = Math.floor(Math.random() * (maxIncome - minIncome + 1)) + minIncome;
    // Bounded loan size relative to income (max 60%) for realistic scenarios
    const maxPossibleLoan = Math.min(maxLoan, Math.floor(income * 0.6));
    const loanAmnt = Math.floor(Math.random() * (maxPossibleLoan - minLoan + 1)) + minLoan;

    const intRate = (Math.random() * 13 + 5).toFixed(2); // 5% to 18%

    const homeOwnership = HOME_OWNERSHIP_OPTIONS[Math.floor(Math.random() * HOME_OWNERSHIP_OPTIONS.length)];
    const intent = LOAN_INTENT_OPTIONS[Math.floor(Math.random() * LOAN_INTENT_OPTIONS.length)];
    const grade = LOAN_GRADE_OPTIONS[Math.floor(Math.random() * LOAN_GRADE_OPTIONS.length)];
    const priorDefault = Math.random() < 0.18 ? 'Y' : 'N';

    setForm({
      person_age: age.toString(),
      person_income: income.toString(),
      person_emp_length: empLength.toString(),
      loan_amnt: loanAmnt.toString(),
      loan_int_rate: intRate.toString(),
      person_home_ownership: homeOwnership,
      loan_intent: intent,
      loan_grade: grade,
      cb_person_default_on_file: priorDefault,
      country: iso,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const income = parseFloat(form.person_income);
    const amount = parseFloat(form.loan_amnt);
    const ratio = (income > 0 && amount > 0) ? amount / income : 0;

    onSubmit({
      ...form,
      person_age:           parseFloat(form.person_age),
      person_income:        income,
      person_emp_length:    parseFloat(form.person_emp_length),
      loan_amnt:            amount,
      loan_int_rate:        parseFloat(form.loan_int_rate),
      loan_percent_income:  ratio,
    });
  };

  // Derive currency from the currently-selected country
  const currency = CURRENCY_MAP[form.country] || { symbol: '$', code: 'USD' };

  // Dynamically calculate loan/income ratio
  const calculatedRatio = (form.loan_amnt && form.person_income)
    ? (parseFloat(form.loan_amnt) / parseFloat(form.person_income)).toFixed(4)
    : '';

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Age */}
        <div className="form-group">
          <label className="form-label" htmlFor="person_age">Age</label>
          <input id="person_age" className="form-control" type="number" min="18" max="100"
            placeholder="e.g. 32" value={form.person_age} onChange={set('person_age')} required />
        </div>

        {/* Annual Income – label shows live currency */}
        <div className="form-group">
          <label className="form-label" htmlFor="person_income">
            Annual Income&nbsp;
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
              ({currency.symbol}&nbsp;{currency.code})
            </span>
          </label>
          <input id="person_income" className="form-control" type="number" min="0"
            placeholder="e.g. 65000" value={form.person_income} onChange={set('person_income')} required />
        </div>

        {/* Employment Length */}
        <div className="form-group">
          <label className="form-label" htmlFor="person_emp_length">Employment Length (yrs)</label>
          <input id="person_emp_length" className="form-control" type="number" min="0" max="60"
            placeholder="e.g. 5" value={form.person_emp_length} onChange={set('person_emp_length')} required />
        </div>

        {/* Loan Amount – label shows live currency */}
        <div className="form-group">
          <label className="form-label" htmlFor="loan_amnt">
            Loan Amount&nbsp;
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
              ({currency.symbol}&nbsp;{currency.code})
            </span>
          </label>
          <input id="loan_amnt" className="form-control" type="number" min="100"
            placeholder="e.g. 15000" value={form.loan_amnt} onChange={set('loan_amnt')} required />
        </div>

        {/* Interest Rate */}
        <div className="form-group">
          <label className="form-label" htmlFor="loan_int_rate">Interest Rate (%)</label>
          <input id="loan_int_rate" className="form-control" type="number" min="0" max="50" step="0.01"
            placeholder="e.g. 11.5" value={form.loan_int_rate} onChange={set('loan_int_rate')} required />
        </div>

        {/* Loan % of Income */}
        <div className="form-group">
          <label className="form-label" htmlFor="loan_percent_income">Loan / Income Ratio</label>
          <input id="loan_percent_income" className="form-control" type="text"
            placeholder="Calculated automatically" value={calculatedRatio} disabled />
        </div>

        {/* Home Ownership */}
        <div className="form-group">
          <label className="form-label" htmlFor="person_home_ownership">Home Ownership</label>
          <select id="person_home_ownership" className="form-control"
            value={form.person_home_ownership} onChange={set('person_home_ownership')}>
            {HOME_OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Loan Intent */}
        <div className="form-group">
          <label className="form-label" htmlFor="loan_intent">Loan Purpose</label>
          <select id="loan_intent" className="form-control"
            value={form.loan_intent} onChange={set('loan_intent')}>
            {LOAN_INTENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Loan Grade */}
        <div className="form-group">
          <label className="form-label" htmlFor="loan_grade">Credit Grade</label>
          <select id="loan_grade" className="form-control"
            value={form.loan_grade} onChange={set('loan_grade')}>
            {LOAN_GRADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Prior Default */}
        <div className="form-group">
          <label className="form-label" htmlFor="cb_person_default_on_file">Prior Default</label>
          <select id="cb_person_default_on_file" className="form-control"
            value={form.cb_person_default_on_file} onChange={set('cb_person_default_on_file')}>
            {DEFAULT_OPTIONS.map(o => <option key={o} value={o}>{o === 'Y' ? 'Yes' : 'No'}</option>)}
          </select>
        </div>

        {/* Country – drives currency above */}
        <div className="form-group full-width">
          <label className="form-label" htmlFor="country">Country of Operation</label>
          <select id="country" className="form-control"
            value={form.country} onChange={set('country')}>
            {countries.length === 0
              ? <option value="">Loading countries…</option>
              : countries.map(c => <option key={c.iso3} value={c.iso3}>{c.country}</option>)
            }
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '1.4rem' }}>
        <button className="btn-secondary" type="button" onClick={handleFillDemo}>
          Fill Demo
        </button>
        <button className="btn-submit" type="submit" disabled={loading} id="evaluate-btn" style={{ flex: 1, marginTop: 0 }}>
          {loading
            ? <><span className="spinner" /> Analyzing Risk…</>
            : <>Evaluate Financial Risk</>
          }
        </button>
      </div>
    </form>
  );
}
