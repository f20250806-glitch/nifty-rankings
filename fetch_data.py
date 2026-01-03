import pandas as pd
import yfinance as yf
import json
import time
import os

# Constants
SP500_CSV_PATH = "nifty50.csv"
OUTPUT_JSON_PATH = "webapp/public/data.json"
CACHE_DIR = "cache"

def load_tickers():
    """Loads Nifty tickers from the local CSV."""
    if not os.path.exists(SP500_CSV_PATH):
        raise FileNotFoundError(f"{SP500_CSV_PATH} not found.")
    
    # Try different encodings
    for encoding in ['utf-8', 'latin1', 'cp1252']:
        try:
            df = pd.read_csv(SP500_CSV_PATH, encoding=encoding)
            # Normalize column names
            df.columns = [c.lower().strip() for c in df.columns]
            
            # Find the ticker column
            if 'symbol' in df.columns:
                return df['symbol'].dropna().unique().tolist()
            elif 'ticker' in df.columns:
                return df['ticker'].dropna().unique().tolist()
        except:
            continue
    raise ValueError("Could not read tickers from CSV properly.")

def fetch_stock_data(tickers):
    """
    Fetches financial data for the list of tickers.
    Returns a list of dictionaries with raw metrics.
    """
    data_list = []
    
    print(f"Fetching data for {len(tickers)} tickers...")
    
    # Batch processing could be faster, but yfinance Ticker object is good for detailed info
    # We'll do it sequentially for safety against rate limits for this demo, 
    # or use Tickers for batching if possible. yf.Tickers is better for batching.
    
    # Splitting into chunks to avoid huge requests failing
    chunk_size = 20
    chunks = [tickers[i:i + chunk_size] for i in range(0, len(tickers), chunk_size)]
    
    total_chunks = len(chunks)
    
    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i+1}/{total_chunks}...")
        
        # Use space-separated string for batch download if using download(), 
        # but for .info we often need individual Ticker objects. 
        # However, yf.Tickers(list) works well.
        
        # NOTE: yfinance's .info is not efficiently batchable via 'download'. 
        # 'download' only gets price history. We need fundamental data.
        # So we must iterate.
        
        for ticker_symbol in chunk:
            try:
                # Append .NS for Nifty stocks
                sym = ticker_symbol.strip().upper()
                if not sym.endswith(".NS"):
                    sym = f"{sym}.NS"
                
                stock = yf.Ticker(sym)
                info = stock.info
                
                # Extract Metrics
                # Momentum: Revenue Growth, Profit Growth (Earnings Growth)
                revenue_growth = info.get('revenueGrowth', None)
                profit_growth = info.get('earningsGrowth', None)
                
                # Quality: ROA, Debt/Equity, Current Ratio, Free Cash Flow
                roa = info.get('returnOnAssets', None)
                debt_to_equity = info.get('debtToEquity', None)
                current_ratio = info.get('currentRatio', None)
                free_cash_flow = info.get('freeCashflow', None)
                
                # Metadata
                market_cap = info.get('marketCap', 0)
                price = info.get('currentPrice', 0.0)
                company_name = info.get('longName', sym)
                sector = info.get('sector', 'Unknown')
                revenue = info.get('totalRevenue', 0)
                
                # We need all metrics to score properly. If critical ones are missing, we might skip.
                # For now, we'll collect even with Nones and handle them later.
                
                data_list.append({
                    "symbol": sym,
                    "company": company_name,
                    "sector": sector,
                    "price": price,
                    "market_cap": market_cap,
                    "revenue": revenue,
                    "momentum_metrics": {
                        "revenue_growth": revenue_growth,
                        "profit_growth": profit_growth
                    },
                    "quality_metrics": {
                        "roa": roa,
                        "debt_to_equity": debt_to_equity,
                        "current_ratio": current_ratio,
                        "free_cash_flow": free_cash_flow
                    }
                })
                
            except Exception as e:
                print(f"Failed to fetch {ticker_symbol}: {e}")
                
    return data_list

def calculate_percentiles(df, column, ascending=True):
    """Calculates percentile rank (0-1) for a column."""
    # Keep NaNs as NaNs so they don't affect ranking distribution
    return df[column].rank(pct=True, ascending=ascending, na_option='keep')

def rank_companies(data_list):
    """
    Ranks companies based on the user's logic:
    Momentum: Revenue Growth (0.25), Profit Growth (0.75)
    Quality: ROA (0.25), Debt/Equity (0.25), Current Ratio (0.25), FCF (0.25)
    """
    df = pd.DataFrame(data_list)
    
    # Flatten metrics for easier processing
    df['revenue_growth'] = df['momentum_metrics'].apply(lambda x: x['revenue_growth'])
    df['profit_growth'] = df['momentum_metrics'].apply(lambda x: x['profit_growth'])
    
    df['roa'] = df['quality_metrics'].apply(lambda x: x['roa'])
    df['debt_to_equity'] = df['quality_metrics'].apply(lambda x: x['debt_to_equity'])
    df['current_ratio'] = df['quality_metrics'].apply(lambda x: x['current_ratio'])
    df['free_cash_flow'] = df['quality_metrics'].apply(lambda x: x['free_cash_flow'])
    
    # Drop rows with minimal data if necessary, or just score them low
    # Let's fill NaNs with safe defaults for ranking (usually bad values) for robustness
    df['revenue_growth'].fillna(-999, inplace=True)
    df['profit_growth'].fillna(-999, inplace=True)
    df['roa'].fillna(-999, inplace=True)
    # df['debt_to_equity'].fillna(9999, inplace=True) # REMOVED: Keep NaN for custom scoring
    df['current_ratio'].fillna(0, inplace=True)
    df['free_cash_flow'].fillna(-999999999, inplace=True)
    
    # Calculate Percentiles
    # Momentum
    df['pct_rev_growth'] = calculate_percentiles(df, 'revenue_growth', ascending=True)
    df['pct_profit_growth'] = calculate_percentiles(df, 'profit_growth', ascending=True)
    
    # Quality
    df['pct_roa'] = calculate_percentiles(df, 'roa', ascending=True)
    # Debt to Equity: Lower is better, so ascending=False
    df['pct_debt_equity'] = calculate_percentiles(df, 'debt_to_equity', ascending=False)
    df['pct_current_ratio'] = calculate_percentiles(df, 'current_ratio', ascending=True)
    df['pct_fcf'] = calculate_percentiles(df, 'free_cash_flow', ascending=True)
    
    # Calculate Scores
    df['momentum_score'] = df['pct_rev_growth']  # Only Revenue Growth now
    
    # Quality Score: Dynamic Weighting
    # If Debt/Equity is valid (available): 33% ROA, 33% D/E, 33% Current Ratio
    # If Debt/Equity is missing (NaN): 50% ROA, 50% Current Ratio
    
    import numpy as np
    df['quality_score'] = np.where(
        df['pct_debt_equity'].notna(),
        (df['pct_roa'] * 0.3333 + df['pct_debt_equity'] * 0.3333 + df['pct_current_ratio'] * 0.3333),
        (df['pct_roa'] * 0.5 + df['pct_current_ratio'] * 0.5)
    )
    
    # Final Composite Score (User specified weights: 33% Momentum, 67% Quality)
    df['composite_score'] = (df['momentum_score'] * 0.33 + df['quality_score'] * 0.67)
    
    # Penalize negative revenue growth (User Rule: Multiply score by 0.65)
    df.loc[df['revenue_growth'] < 0, 'composite_score'] *= 0.65
    
    # Fill NaN scores (if any remain) with 0 just in case
    df['display_score'] = (df['composite_score'].fillna(0) * 100).round(0).astype(int)
    
    # Sort
    df_sorted = df.sort_values(by='composite_score', ascending=False)
    
    return df_sorted

def main():
    print("Step 1: Loading Tickers...")
    try:
        tickers = load_tickers()
        # limit for testing speed if needed, but user wants all. 
        # For the first rapid pass, let's just do top 50 from the CSV to ensure it works quickly, 
        # BUT user asked for "fetched all". 
        # I will fetch a subset initially to verify logic, then I can run full.
        # Actually, let's run a smaller set (e.g. 20) first to verify the script runs, 
        # then I can let it run longer or use the mock data approach if it's too slow for the interaction loop.
        # User said "fetches all", so I should try. But 500 requests is slow.
        # I will start with a sample to prove it works.
        # Processing all tickers
        sample_tickers = tickers
        print(f"Loaded {len(tickers)} tickers. Processing all for production...")
        
        data = fetch_stock_data(sample_tickers)
        
        print("Step 2: Ranking...")
        ranked_df = rank_companies(data)
        
        # Select all ranked companies
        export_df = ranked_df
        
        # Prepare for export
        output_data = export_df[[
            'symbol', 'company', 'sector', 'price', 'market_cap', 'revenue', 
            'display_score', 'momentum_score', 'quality_score',
            'revenue_growth', 'profit_growth', 
            'roa', 'debt_to_equity', 'current_ratio',
            'pct_rev_growth', 'pct_profit_growth', 
            'pct_roa', 'pct_debt_equity', 'pct_current_ratio'
        ]].to_dict(orient='records')
        
        # ensure output dir
        os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
        
        with open(OUTPUT_JSON_PATH, 'w') as f:
            json.dump(output_data, f, indent=2)
            
        print(f"Success! Top 10 exported to {OUTPUT_JSON_PATH}")
        print(export_df[['symbol', 'display_score']].head(10))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
