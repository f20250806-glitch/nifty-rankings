import yfinance as yf
import json

def check_keys():
    print("Fetching info for HDFCBANK.NS (Bank)...")
    bank = yf.Ticker("HDFCBANK.NS").info
    
    print("Fetching info for RELIANCE.NS (Non-Bank)...")
    non_bank = yf.Ticker("RELIANCE.NS").info
    
    print("\n--- HDFCBANK.NS KEYS ---")
    print(sorted(bank.keys()))
    
    print("\n--- RELIANCE.NS KEYS ---")
    print(sorted(non_bank.keys()))
    
    # Check for specific requested metrics
    requested_bank_metrics = ["provisionCoverageRatio", "creditCost", "loanGrowth", "depositGrowth", "netInterestMargin", "costToIncome"]
    requested_non_bank_metrics = ["roce", "ebitdaMargins", "revenueCAGR3Y", "epsCAGR3Y", "freeCashFlowYield"]
    
    print("\n--- MISSING CHECK ---")
    for m in requested_bank_metrics:
        found = any(k.lower().replace(" ","") == m.lower() for k in bank.keys())
        # Also check fuzzy
        print(f"Bank Metric '{m}': {'FOUND' if found else 'NOT FOUND'}")

    for m in requested_non_bank_metrics:
        found = any(k.lower().replace(" ","") == m.lower() for k in non_bank.keys())
        print(f"Non-Bank Metric '{m}': {'FOUND' if found else 'NOT FOUND'}")

if __name__ == "__main__":
    check_keys()
