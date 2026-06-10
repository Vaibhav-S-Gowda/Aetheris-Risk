import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# Make sure output directories exist
os.makedirs('../server/model_assets', exist_ok=True)
os.makedirs('../server/data', exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 – Credit Risk ML Model
# ─────────────────────────────────────────────────────────────────────────────
print("--- Step 1: Processing Credit Risk Dataset ---")
df_credit = pd.read_csv('../credit_risk_dataset.csv')
print(f"Loaded credit risk dataset. Shape: {df_credit.shape}")

# Identify column types
num_cols = df_credit.select_dtypes(include='number').columns.tolist()
num_cols = [c for c in num_cols if c != 'loan_status']
cat_cols = df_credit.select_dtypes(include='object').columns.tolist()

# Persist imputation values so the inference bridge can reproduce them
imputation_values = {
    'numeric_medians': {},
    'categorical_modes': {}
}

for col in num_cols:
    median_val = float(df_credit[col].median())
    imputation_values['numeric_medians'][col] = median_val
    df_credit[col] = df_credit[col].fillna(median_val)

for col in cat_cols:
    mode_val = str(df_credit[col].mode()[0])
    imputation_values['categorical_modes'][col] = mode_val
    df_credit[col] = df_credit[col].fillna(mode_val)

df_credit.drop_duplicates(inplace=True)

# IQR outlier removal (3 × IQR)
outlier_cols = ['person_age', 'person_income', 'person_emp_length', 'loan_amnt', 'loan_int_rate']
mask = pd.Series([True] * len(df_credit), index=df_credit.index)
for col in outlier_cols:
    Q1 = df_credit[col].quantile(0.25)
    Q3 = df_credit[col].quantile(0.75)
    IQR = Q3 - Q1
    mask &= df_credit[col].between(Q1 - 3 * IQR, Q3 + 3 * IQR)

df_clean = df_credit[mask].reset_index(drop=True)
print(f"Cleaned dataset shape (after duplicates & outliers): {df_clean.shape}")

# Label‑encode categoricals
encoders = {}
df_model = df_clean.copy()
for col in cat_cols:
    le = LabelEncoder()
    df_model[col] = le.fit_transform(df_model[col].astype(str))
    encoders[col] = le
    imputation_values[f'classes_{col}'] = le.classes_.tolist()

joblib.dump(imputation_values, '../server/model_assets/imputation_and_classes.joblib')

for col, le in encoders.items():
    joblib.dump(le, f'../server/model_assets/encoder_{col}.joblib')

# Feature selection by correlation with target
corr = df_model.corr()
target_corr = corr['loan_status'].abs().drop('loan_status')
selected_features = target_corr[target_corr > 0.03].index.tolist()
# Exclude loan_grade to prevent the model from predicting solely/primarily based on credit grade
selected_features = [f for f in selected_features if f != 'loan_grade']
print(f"Selected features: {selected_features}")

with open('../server/model_assets/selected_features.json', 'w') as f:
    json.dump(selected_features, f)

X = df_model[selected_features]
y = df_model['loan_status']

scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=selected_features)
joblib.dump(scaler, '../server/model_assets/scaler.joblib')

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.20, random_state=42, stratify=y
)

rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)
y_proba = rf.predict_proba(X_test)[:, 1]
test_auc = roc_auc_score(y_test, y_proba)
print(f"Verification – Random Forest Test AUC: {test_auc:.4f}")

# Final model trained on full cleaned dataset
final_rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
final_rf.fit(X_scaled, y)
joblib.dump(final_rf, '../server/model_assets/random_forest_model.joblib')
print("Model assets saved successfully.\n")


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 – ESG Country Data
# Uses indicators that actually have 2022 data in the dataset.
# ─────────────────────────────────────────────────────────────────────────────
print("--- Step 2: Processing ESG Dataset ---")
df_esg_raw = pd.read_excel('../esgdata_download-2026-01-09.xlsx', sheet_name='Data')
print(f"Loaded ESG dataset. Shape: {df_esg_raw.shape}")

# Map: short key  →  (indicator name in Excel, higher‑is‑better flag)
INDICATOR_MAP = {
    'renewable_energy':    ('Renewable energy consumption (% of total final energy consumption)', True),
    'access_electricity':  ('Access to electricity (% of population)', True),
    'corruption_control':  ('Control of Corruption: Estimate', True),
    'political_stability': ('Political Stability and Absence of Violence/Terrorism: Estimate', True),
    'rule_of_law':         ('Rule of Law: Estimate', True),
    'forest_area':         ('Forest area (% of land area)', True),
    'fossil_fuel':         ('Fossil fuel energy consumption (% of total)', False),   # lower is better
    'ghg_per_capita':      ('Total greenhouse gas emissions per capita excluding LULUCF (t CO2e/capita)', False),
    'unemployment':        ('Unemployment, total (% of total labor force) (modeled ILO estimate)', False),
    'pm25':                ('PM2.5 air pollution, mean annual exposure (micrograms per cubic meter)', False),
}

indicator_names = [v[0] for v in INDICATOR_MAP.values()]
df_esg_filtered = df_esg_raw[df_esg_raw['Indicator name'].isin(indicator_names)].copy()

# For each indicator pick the best available year (prefer 2022, fall back to 2021, then 2020)
records_by_iso = {}
for key, (ind_name, higher_better) in INDICATOR_MAP.items():
    sub = df_esg_filtered[df_esg_filtered['Indicator name'] == ind_name][
        ['ISO3 code', 'Economy', '2022', '2021', '2020']
    ].copy()
    # Choose best available year
    sub['value'] = sub['2022'].combine_first(sub['2021']).combine_first(sub['2020'])
    for _, row in sub.iterrows():
        iso = row['ISO3 code']
        if iso not in records_by_iso:
            records_by_iso[iso] = {'iso3': iso, 'country': row['Economy']}
        records_by_iso[iso][key] = float(row['value']) if pd.notna(row['value']) else None

# Compute normalised composite ESG score
raw_df = pd.DataFrame.from_dict(records_by_iso, orient='index')
numeric_keys = list(INDICATOR_MAP.keys())
numeric_sub = raw_df[numeric_keys].copy()

# Normalise 0‑1
norm_sub = (numeric_sub - numeric_sub.min()) / (numeric_sub.max() - numeric_sub.min())

# Invert "lower‑is‑better" indicators
for key, (_, higher_better) in INDICATOR_MAP.items():
    if not higher_better and key in norm_sub.columns:
        norm_sub[key] = 1 - norm_sub[key]

raw_df['esg_score'] = norm_sub.mean(axis=1)
global_avg = raw_df['esg_score'].mean()
raw_df['esg_score'] = raw_df['esg_score'].fillna(global_avg)

# Fill numeric NaNs with 0.0 for safe JSON serialisation
for key in numeric_keys:
    raw_df[key] = raw_df[key].fillna(0.0)

esg_records = raw_df.reset_index(drop=True).to_dict(orient='records')

with open('../server/data/country_esg_data.json', 'w') as f:
    json.dump(esg_records, f, indent=2)

print(f"Saved ESG data for {len(esg_records)} countries to server/data/country_esg_data.json")
print("Data pipeline execution finished successfully!")
