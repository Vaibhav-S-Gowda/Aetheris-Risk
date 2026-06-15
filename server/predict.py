import sys
import json
import joblib
import numpy as np
import pandas as pd
import time
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.preprocessing import LabelEncoder, StandardScaler

ASSETS = Path(__file__).parent / 'model_assets'
CSV_PATH = Path(__file__).parent / 'data' / 'credit_risk_dataset.csv'

# Preloaded training data for on-the-fly hyperparameter tuning
X_train_s = None
X_test_s = None
y_train_s = None
y_test_s = None
encoders_s = {}
scaler_s = None
tuning_available = False


def load_assets():
    rf         = joblib.load(ASSETS / 'random_forest_model.joblib')
    scaler     = joblib.load(ASSETS / 'scaler.joblib')
    info       = joblib.load(ASSETS / 'imputation_and_classes.joblib')
    with open(ASSETS / 'selected_features.json') as f:
        features = json.load(f)
    return rf, scaler, info, features


def preload_training_data(features):
    global X_train_s, X_test_s, y_train_s, y_test_s, encoders_s, scaler_s, tuning_available
    try:
        if not CSV_PATH.exists():
            return
        
        df = pd.read_csv(CSV_PATH)
        df = df.dropna().drop_duplicates()
        
        # IQR Outlier cleaning
        outlier_cols = ['person_age', 'person_income', 'person_emp_length', 'loan_amnt', 'loan_int_rate']
        mask = pd.Series([True] * len(df), index=df.index)
        for col in outlier_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            mask &= df[col].between(Q1 - 3 * IQR, Q3 + 3 * IQR)
        df_clean = df[mask].reset_index(drop=True)
        
        # Encoders
        cat_cols = ['person_home_ownership', 'loan_intent', 'cb_person_default_on_file']
        for col in cat_cols:
            le = LabelEncoder()
            df_clean[col] = le.fit_transform(df_clean[col].astype(str))
            encoders_s[col] = le
            
        X = df_clean[features]
        y = df_clean['loan_status']
        
        scaler_s = StandardScaler()
        X_scaled = pd.DataFrame(scaler_s.fit_transform(X), columns=features)
        
        # Subsample to 8000 records for fast training on limited cloud CPU
        df_sub = pd.concat([X_scaled, y], axis=1).sample(n=8000, random_state=42)
        X_sub = df_sub[features]
        y_sub = df_sub['loan_status']
        
        X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
            X_sub, y_sub, test_size=0.20, random_state=42, stratify=y_sub
        )
        tuning_available = True
    except Exception as e:
        print(f"Failed to preload training data: {str(e)}", file=sys.stderr)


def build_feature_row(raw: dict, info: dict, features: list) -> pd.DataFrame:
    """
    Applies the same imputation + encoding logic used during training.
    """
    encoders = {}
    for col in info.get('categorical_modes', {}):
        enc_path = ASSETS / f'encoder_{col}.joblib'
        if enc_path.exists():
            encoders[col] = joblib.load(enc_path)

    row = {}
    # Numeric imputation
    for col, default in info['numeric_medians'].items():
        val = raw.get(col, default)
        row[col] = float(val) if val is not None else default

    # Categorical encoding
    for col, le in encoders.items():
        raw_val = str(raw.get(col, info['categorical_modes'][col]))
        classes = list(le.classes_)
        if raw_val not in classes:
            raw_val = info['categorical_modes'][col]
        row[col] = int(le.transform([raw_val])[0])

    df = pd.DataFrame([row])
    # Keep only selected features in correct order
    for feat in features:
        if feat not in df.columns:
            df[feat] = 0.0

    return df[features]


def build_feature_row_tuned(raw: dict, features: list) -> pd.DataFrame:
    row = {}
    
    # Numeric imputation defaults (medians)
    numeric_medians = {
        'person_age': 26.0,
        'person_income': 55000.0,
        'person_emp_length': 4.0,
        'loan_amnt': 8000.0,
        'loan_int_rate': 10.99,
        'loan_percent_income': 0.15
    }
    
    for col, default in numeric_medians.items():
        val = raw.get(col, default)
        row[col] = float(val) if val is not None else default
        
    # Categorical encoding
    categorical_modes = {
        'person_home_ownership': 'RENT',
        'loan_intent': 'PERSONAL',
        'cb_person_default_on_file': 'N'
    }
    
    for col, le in encoders_s.items():
        raw_val = str(raw.get(col, categorical_modes[col]))
        classes = list(le.classes_)
        if raw_val not in classes:
            raw_val = categorical_modes[col]
        row[col] = int(le.transform([raw_val])[0])
        
    df = pd.DataFrame([row])
    # Ensure columns are in the exact features order
    for feat in features:
        if feat not in df.columns:
            df[feat] = 0.0
            
    return df[features]


def main():
    # Load assets once at startup
    try:
        rf, scaler, info, features = load_assets()
        # Preload the raw dataset for hyperparameter tuning
        preload_training_data(features)
        # Print READY to stdout so Node knows the worker is ready
        print("READY", flush=True)
    except Exception as e:
        print(json.dumps({'error': f'Failed to load assets: {str(e)}'}), flush=True)
        sys.exit(1)

    # Read inputs line-by-line from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            raw = json.loads(line)
            hyper = raw.get('hyperparameters', None)
            
            if hyper and tuning_available:
                # Run on-the-fly hyperparameter tuning
                n_est = int(hyper.get('n_estimators', 100))
                depth_val = hyper.get('max_depth', None)
                depth = int(depth_val) if (depth_val is not None and str(depth_val).lower() != 'none') else None
                min_split = int(hyper.get('min_samples_split', 2))
                
                t0 = time.time()
                # Train model
                rf_tuned = RandomForestClassifier(
                    n_estimators=n_est,
                    max_depth=depth,
                    min_samples_split=min_split,
                    random_state=42,
                    n_jobs=-1
                )
                rf_tuned.fit(X_train_s, y_train_s)
                t1 = time.time()
                
                # Evaluate metrics on validation set
                y_pred_proba = rf_tuned.predict_proba(X_test_s)[:, 1]
                y_pred = rf_tuned.predict(X_test_s)
                auc = float(roc_auc_score(y_test_s, y_pred_proba))
                acc = float(accuracy_score(y_test_s, y_pred))
                train_time_ms = float((t1 - t0) * 1000)
                
                # Predict on current instance
                df = build_feature_row_tuned(raw, features)
                df_scaled = pd.DataFrame(scaler_s.transform(df), columns=features)
                prob = float(rf_tuned.predict_proba(df_scaled)[0][1])
                
                print(json.dumps({
                    'probability': prob,
                    'tuning': {
                        'auc': round(auc, 4),
                        'accuracy': round(acc, 4),
                        'training_time_ms': round(train_time_ms, 2)
                    }
                }), flush=True)
            else:
                # Use base pre-trained model
                df = build_feature_row(raw, info, features)
                df_scaled = pd.DataFrame(scaler.transform(df), columns=features)
                prob = float(rf.predict_proba(df_scaled)[0][1])
                print(json.dumps({'probability': prob}), flush=True)
        except Exception as e:
            print(json.dumps({'error': str(e)}), flush=True)


if __name__ == '__main__':
    main()


