import yfinance as yf
import pandas as pd
import json
import os
import sys

# Hardcoded Nifty 50 Tickers (Updated Jan 2026)
NIFTY_50_TICKERS = [
    "ADANIENT.NS", "ADANIPORTS.NS", "APOLLOHOSP.NS", "ASIANPAINT.NS", "AXISBANK.NS",
    "BAJAJ-AUTO.NS", "BAJFINANCE.NS", "BAJAJFINSV.NS", "BPCL.NS", "BHARTIARTL.NS",
    "BRITANNIA.NS", "CIPLA.NS", "COALINDIA.NS", "DRREDDY.NS", "EICHERMOT.NS",
    "GRASIM.NS", "HCLTECH.NS", "HDFCBANK.NS", "HDFCLIFE.NS", "HINDALCO.NS",
    "HINDUNILVR.NS", "ICICIBANK.NS", "ITC.NS", "INFY.NS", "JSWSTEEL.NS",
    "KOTAKBANK.NS", "LT.NS", "M&M.NS", "MARUTI.NS", "NTPC.NS",
    "NESTLEIND.NS", "ONGC.NS", "POWERGRID.NS", "RELIANCE.NS", "SBILIFE.NS",
    "SBIN.NS", "SUNPHARMA.NS", "TCS.NS", "TATACONSUM.NS", "TATAMOTORS.NS",
    "TATASTEEL.NS", "TECHM.NS", "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS",
    # New Inclusions (2024-2026)
    "TRENT.NS", "BEL.NS", "SHRIRAMFIN.NS", "INDIGO.NS", "MAXHEALTH.NS"
]

BANK_TICKERS = [
    "AXISBANK.NS", "HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", 
    "SBIN.NS", "BAJFINANCE.NS", "BAJAJFINSV.NS", "SHRIRAMFIN.NS" # Added Shriram (NBFC)
]

def get_metric(info, keys, default=0.0):
    for key in keys:
        if key in info and info[key] is not None:
            return info[key]
    return default

def calculate_bank_score(info):
    # Banks & Financials Logic (Revised)
    # 1. Profitability (45%): ROA, ROE
    roa = get_metric(info, ['returnOnAssets'], 0) * 100
    roe = get_metric(info, ['returnOnEquity'], 0) * 100
    
    # 2. Valuation (25%): P/B (Lower is better) - P/E Removed
    pb = get_metric(info, ['priceToBook'])
    
    # Valuation scoring: Inverse. 
    # Heuristic: Good P/B < 3.
    # We'll normalize roughly: Score = 100 / (Metric/Target). 
    
    val_pb_score = 100
    if pb and pb > 0:
        val_pb_score = max(0, min(100, (1.5 / pb) * 50)) # 1.5 P/B is great
        
    # Valuation Total is just P/B now
    valuation_total = val_pb_score
    
    # 3. Market Performance (30%): 1-Year Return
    momentum = get_metric(info, ['52WeekChange'], 0) * 100
    # Normalize: Assuming >20% is great (100), <0% is bad.
    mom_score = max(0, min(100, (momentum + 20) * 2)) 

    # Weighted Sum
    # Profitability (45%): Split equally between ROA and ROE?
    score_roe = max(0, min(100, (roe / 15) * 100))
    score_roa = max(0, min(100, (roa / 1.5) * 100))
    profit_score = (score_roe + score_roa) / 2
    
    final_score = (
        (profit_score * 0.45) + 
        (valuation_total * 0.25) + 
        (mom_score * 0.30)
    )
    return max(0, min(100, final_score))

def calculate_non_bank_score(info):
    # Non-Banks Logic (Revised)
    # 1. Profitability (35%): ROE, EBITDA Margin
    roe = get_metric(info, ['returnOnEquity'], 0) * 100
    ebitda_margins = get_metric(info, ['ebitdaMargins'], 0) * 100
    
    score_roe = max(0, min(100, (roe / 20) * 100)) 
    score_margin = max(0, min(100, (ebitda_margins / 20) * 100))
    profit_score = (score_roe + score_margin) / 2
    
    # 2. Valuation (30%): EV/EBITDA (Lower better) - P/E Removed
    ev_ebitda = get_metric(info, ['enterpriseToEbitda'])
    
    val_ev_score = 100
    if ev_ebitda and ev_ebitda > 0:
        val_ev_score = max(0, min(100, (12 / ev_ebitda) * 50))
        
    # Valuation Score is just EV/EBITDA now
    valuation_score = val_ev_score

    # 3. Financial Stability (20%): Debt/Equity
    # D/E: Lower better (<1 good).
    de = get_metric(info, ['debtToEquity'], 0) / 100 
    
    score_de = max(0, min(100, (1 - (de/2)) * 100)) # If D/E is 2 (200%), score is 0. If 0, score 100.
    
    stability_score = score_de
    
    # 4. Market Performance (15%): 1-Year Return
    momentum = get_metric(info, ['52WeekChange'], 0) * 100
    mom_score = max(0, min(100, (momentum + 20) * 2))
    
    final_score = (
        (profit_score * 0.35) +
        (valuation_score * 0.30) +
        (stability_score * 0.20) +
        (mom_score * 0.15)
    )
    
    return max(0, min(100, final_score))

def main():
    print("Fetching data for Nifty 50...")
    rankings = []
    
    # Create webapp/public if not exists (handling project structure)
    os.makedirs('webapp/public', exist_ok=True)

    for ticker in NIFTY_50_TICKERS:
        try:
            print(f"Processing {ticker}...")
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Basic Info
            name = info.get('shortName', ticker)
            sector = info.get('sector', 'Unknown')
            price = info.get('currentPrice')

            # Strict check: If price or sector is missing, skip
            if price is None:
                print(f"Skipping {ticker}: Missing price data.")
                continue

            is_bank = ticker in BANK_TICKERS or 'Bank' in name
            
            # Check for essential metrics based on type
            # If critical metrics are missing, we skip.
            # Note: We are still using yfinance, so "check various sources" is limited to what yfinance provides.
            # If we were to use other sources, we'd need more libraries/apis.
            
            try:
                if is_bank:
                    # Banks need ROA, ROE, etc.
                    # If any key metric is 0 or None where it shouldn't be, we might skip.
                    # But yfinance often returns None for some specific fields.
                    # We will try to calculate score, if standard keys are missing, we skip.
                    if info.get('returnOnEquity') is None:
                         raise ValueError("Missing returnOnEquity")
                    score = calculate_bank_score(info)
                    category = "Banking & Finance"
                else:
                    if info.get('returnOnEquity') is None:
                        raise ValueError("Missing returnOnEquity")
                    score = calculate_non_bank_score(info)
                    category = "Non-Banking"
            except ValueError as ve:
                print(f"Skipping {ticker}: {ve}")
                continue
            
            rankings.append({
                "ticker": ticker,
                "name": name,
                "sector": sector,
                "price": price,
                "score": round(score, 2),
                "category": category,
                "metrics": {
                    "roe": round(get_metric(info, ['returnOnEquity'], 0) * 100, 2),
                    "roa": round(get_metric(info, ['returnOnAssets'], 0) * 100, 2),
                    "pe": round(get_metric(info, ['trailingPE', 'forwardPE'], 0), 2),
                    "pb": round(get_metric(info, ['priceToBook'], 0), 2),
                    "ev_ebitda": round(get_metric(info, ['enterpriseToEbitda'], 0), 2),
                    "growth": round(get_metric(info, ['revenueGrowth'], 0) * 100, 2),
                    "margins": round(get_metric(info, ['ebitdaMargins', 'profitMargins'], 0) * 100, 2),
                    "de": round(get_metric(info, ['debtToEquity'], 0), 0), # Raw percent or ratio
                    "momentum": round(get_metric(info, ['52WeekChange'], 0) * 100, 2)
                }
            })
            
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")
            continue
    
    # Sort by score descending
    rankings.sort(key=lambda x: x['score'], reverse=True)
    
    # Add Rank
    for i, item in enumerate(rankings):
        item['rank'] = i + 1

    # Calculate Percentiles
    # 1. Gather all values for each metric
    metric_values = {}
    for item in rankings:
        for key, val in item['metrics'].items():
            if key not in metric_values:
                metric_values[key] = []
            if val is not None:
                metric_values[key].append(val)
    
    # 2. Sort values for ranking
    for key in metric_values:
        metric_values[key].sort()
        
    # 3. Assign percentiles
    from bisect import bisect_left
    
    for item in rankings:
        item['percentiles'] = {}
        for key, val in item['metrics'].items():
            if val is not None and key in metric_values:
                # Find rank
                # For 'pe', 'pb', 'ev_ebitda', 'debt_to_equity': Lower is better (Higher percentile?)
                # Usually Percentile means "better than X% of others".
                # If Lower is better, then being at bottom of sorted list is "High Percentile".
                
                sorted_vals = metric_values[key]
                rank = bisect_left(sorted_vals, val)
                raw_percentile = (rank / len(sorted_vals)) * 100
                
                # Invert for metrics where lower is better
                lower_is_better = ['pe', 'pb', 'ev_ebitda', 'de'] # Add relevant keys
                # We need to ensure we map keys correctly.
                # In previous step we added keys: 'roe', 'pe', 'growth'.
                # We need to verify what keys are actually in 'metrics'.
                
                # Wait, I need to make sure 'metrics' in the loop has all the fields we want to show percentiles for.
                # Currently it has 'roe', 'pe', 'growth'.
                # I should add 'pb', 'ev_ebitda', 'de', 'margins', 'momentum' to 'metrics' first if I want to show them!
                
                if key in ['pe', 'pb', 'de']: # Common lower-is-better
                     item['percentiles'][key] = round(100 - raw_percentile, 1)
                else:
                     item['percentiles'][key] = round(raw_percentile, 1)

    with open('webapp/public/rankings.json', 'w') as f:
        json.dump(rankings, f, indent=2)
    
    print("Done! Rankings saved to webapp/public/rankings.json")

if __name__ == "__main__":
    main()
