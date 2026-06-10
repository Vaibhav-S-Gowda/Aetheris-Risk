"""
predict.py – Python inference bridge invoked by predictor.js.

Usage:
    python predict.py '<JSON string of input features>'

Output:
    JSON to stdout: {"probability": <float>}
"""
import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

ASSETS = Path(__file__).parent / 'model_assets'


def load_assets():
    rf         = joblib.load(ASSETS / 'random_forest_model.joblib')
    scaler     = joblib.load(ASSETS / 'scaler.joblib')
    info       = joblib.load(ASSETS / 'imputation_and_classes.joblib')
    with open(ASSETS / 'selected_features.json') as f:
        features = json.load(f)
    return rf, scaler, info, features


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


def main():
    # Load assets once at startup
    try:
        rf, scaler, info, features = load_assets()
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
            df = build_feature_row(raw, info, features)
            df_scaled = pd.DataFrame(scaler.transform(df), columns=features)
            prob = float(rf.predict_proba(df_scaled)[0][1])
            print(json.dumps({'probability': prob}), flush=True)
        except Exception as e:
            print(json.dumps({'error': str(e)}), flush=True)


if __name__ == '__main__':
    main()

