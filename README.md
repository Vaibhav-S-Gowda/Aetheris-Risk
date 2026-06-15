# Aetheris Risk

Aetheris Risk is an intelligent, real-time credit risk assessment application that integrates traditional credit analytics with country-level Environmental, Social, and Governance (ESG) sustainability metrics.

The system allows credit underwriters and analysts to evaluate risk profiles, adjust model hyperparameters dynamically, and inspect performance benchmarks.

---

## Architecture and System Design

```mermaid
graph TD
    classDef client fill:#f9f9f9,stroke:#111,stroke-width:2px;
    classDef server fill:#f5f5f3,stroke:#333,stroke-width:2px;
    classDef database fill:#eee,stroke:#444,stroke-width:1px;

    subgraph Client [Frontend - React / Vite]
        UI[User Interface / App.jsx]:::client
        Form[Risk Form / Sliders]:::client
        Results[Results & ESG Charts]:::client
        State[Local Storage State]:::client
    end

    subgraph Server [Backend - Node.js / Express]
        API[Express Router / API endpoints]:::server
        Predictor[Predictor Module / Child Process Manager]:::server
        PyWorker[Persistent Python Worker / predict.py]:::server
    end

    subgraph Storage [Database & Data Assets]
        DB[(MongoDB / History Records)]:::database
        Models[(Random Forest Model / Joblib)]:::database
        Dataset[(Credit Dataset / CSV)]:::database
    end

    %% Interactions
    UI --> Form
    UI --> Results
    Form -->|Submit Inputs & Hyperparameters| API
    API -->|Manage Subprocess Pipe| Predictor
    Predictor -->|stdin: JSON Inputs| PyWorker
    PyWorker -->|stdout: Risk Probability & Metrics| Predictor
    PyWorker -->|Load Pre-trained Model| Models
    PyWorker -->|Read dataset for tuning| Dataset
    API -->|Query / Save Records| DB
    Results -->|Load Historical Runs| State
```

---

## Key Features

- **Hybrid Credit & ESG Scoring**: Combines borrower credit parameters with country-level ESG factors to produce a composite sustainability-adjusted risk label.
- **Dynamic Hyperparameter Tuning**: Allows on-the-fly model retraining (Trees, Max Depth, Min Samples Split) directly from the user interface.
- **Persistent Python Predictor**: Utilizes a persistent child process worker communication architecture to bypass cold-start imports and execute model predictions in ~30–150 ms.
- **Historical Run Benchmarking**: Tracks and compares model iterations with an active evaluation card showing validation metrics (AUC, Accuracy, Training latency).

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+) with pip

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vaibhav-S-Gowda/Aetheris-Risk.git
   cd Aetheris-Risk
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   # Ensure required Python libraries are installed
   pip install scikit-learn joblib numpy pandas
   ```

3. **Frontend Setup**:
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

1. **Start the Backend Server**:
   ```bash
   cd server
   node index.js
   ```
   *The server runs on `http://localhost:5000`.*

2. **Start the Frontend Development Server**:
   ```bash
   cd client
   npm run dev
   ```
   *The development app runs on `http://localhost:5173`.*

---

## Deployment Configuration

### Backend (Render)
- **Root Directory**: `server`
- **Build Command**: `npm install && pip install scikit-learn joblib numpy pandas`
- **Start Command**: `node index.js`
- **Required Environment Variables**: 
  - `MONGO_URI` (Optional: MongoDB database connection string)
  - `CLIENT_ORIGIN` (Vercel deployment URL)

### Frontend (Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework Preset**: `Vite`
