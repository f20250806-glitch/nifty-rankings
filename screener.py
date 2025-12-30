import time
import yfinance as yf
import pandas as pd


# -----------------------------
# Step 1: Universe of stocks
# -----------------------------
def get_universe():
    return [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META",
        "NVDA", "TSLA", "JPM", "V", "WMT"
    ]


# -----------------------------
# Step 2: Fetch fundamentals
# -----------------------------
def fetch_fundamentals(symbol):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info

        return {
            "symbol": symbol,
            "price": info.get("currentPrice"),
            "volume": info.get("volume"),
            "roa": info.get("returnOnAssets"),
            "de_ratio": info.get("debtToEquity"),
            "interest_coverage": info.get("interestCoverage"),
        }

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


# -----------------------------
# Step 3: Clean data (ROBUST)
# -----------------------------
def clean_data(results):
    df = pd.DataFrame(results)

    # Ensure expected columns exist
    for col in ["price", "volume", "roa", "de_ratio", "interest_coverage"]:
        if col not in df.columns:
            df[col] = None

    # Require at least SOME usable data (not everything missing)
    df = df.dropna(
        how="all",
        subset=["price", "volume", "roa", "de_ratio", "interest_coverage"]
    )

    return df


# -----------------------------
# Step 4: Rank stocks
# -----------------------------
def rank_stocks(df):
    # Simple scoring logic (safe with NaNs)
    df["score"] = (
        df["roa"].fillna(0) * 3
        - df["de_ratio"].fillna(0) * 0.01
        + df["interest_coverage"].fillna(0) * 0.5
    )

    df = df.sort_values(by="score", ascending=False)

    return df


# -----------------------------
# Step 5: Main pipeline
# -----------------------------
def run_screening_pipeline():
    universe = get_universe()
    results = []

    for symbol in universe:
        data = fetch_fundamentals(symbol)
        if data:
            results.append(data)

        time.sleep(0.1)  # avoid Yahoo rate limits

    if not results:
        return []

    df = clean_data(results)

    if df.empty:
        return []

    df = rank_stocks(df)

    # Return top 10 as JSON-safe dicts
    return df.head(10).to_dict(orient="records")
