import streamlit as st
import pandas as pd
import numpy as np
from pathlib import Path

st.set_page_config(
    page_title="S&P 500 Quality + Momentum Ranking Engine",
    layout="wide"
)

st.title("📊 S&P 500 Quality + Momentum Ranking Engine")
st.caption("Source: Static CSV • Fully Offline • Error-Proof")

CSV_PATH = Path("sp500.csv")

@st.cache_data(show_spinner=False)
def load_universe(csv_path: Path) -> pd.DataFrame:
    if not csv_path.exists():
        st.error("sp500.csv not found in project directory.")
        return pd.DataFrame()

    # Try encodings safely
    for enc in ["utf-8", "utf-8-sig", "latin1", "cp1252"]:
        try:
            df = pd.read_csv(csv_path, encoding=enc)
            break
        except Exception:
            df = None

    if df is None or df.empty:
        st.error("Failed to read sp500.csv with any encoding.")
        return pd.DataFrame()

    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()

    # Accept multiple naming conventions
    if "ticker" in df.columns:
        df["symbol"] = df["ticker"]
    if "security" in df.columns:
        df["company"] = df["security"]

    if not {"symbol", "company"}.issubset(df.columns):
        st.error("CSV must contain Ticker/Security or symbol/company columns.")
        return pd.DataFrame()

    df = df[["symbol", "company"]].dropna().drop_duplicates()
    df["symbol"] = df["symbol"].astype(str).str.upper().str.strip()
    df["company"] = df["company"].astype(str).str.strip()

    return df.reset_index(drop=True)

# ---------- LOAD DATA ----------
universe = load_universe(CSV_PATH)

st.button("🔄 Refresh data", on_click=st.cache_data.clear)

if universe.empty:
    st.error("Universe is empty. Check sp500.csv.")
    st.stop()

# ---------- MOCK METRICS (OFFLINE SAFE) ----------
np.random.seed(42)

universe["roa"] = np.random.uniform(0.05, 0.30, len(universe))
universe["interest_coverage"] = np.random.uniform(3, 30, len(universe))
universe["de_ratio"] = np.random.uniform(0.1, 2.0, len(universe))
universe["one_year_return"] = np.random.uniform(-0.2, 0.6, len(universe))

# ---------- RANKING ----------
universe["roa_rank"] = universe["roa"].rank(pct=True)
universe["interest_rank"] = universe["interest_coverage"].rank(pct=True)
universe["de_rank"] = (1 / universe["de_ratio"]).rank(pct=True)
universe["momentum_rank"] = universe["one_year_return"].rank(pct=True)

universe["quality_score"] = (
    universe["roa_rank"]
    + universe["interest_rank"]
    + universe["de_rank"]
) / 3

universe["final_score"] = (
    0.6 * universe["quality_score"]
    + 0.4 * universe["momentum_rank"]
)

universe = universe.sort_values("final_score", ascending=False)

# ---------- DISPLAY ----------
st.subheader("🏆 Top Ranked Companies")

st.dataframe(
    universe[
        [
            "symbol",
            "company",
            "quality_score",
            "momentum_rank",
            "final_score",
        ]
    ].head(50),
    use_container_width=True,
)
