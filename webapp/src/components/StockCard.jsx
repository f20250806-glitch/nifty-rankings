import React, { useState } from 'react';

const formatCurrency = (val) => {
    if (!val) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
};

const formatLargeNumber = (num) => {
    if (!num) return '-';
    if (num >= 1e7) return (num / 1e7).toFixed(2) + ' Cr';
    if (num >= 1e5) return (num / 1e5).toFixed(2) + ' L';
    return num.toString();
};

const formatPercentage = (num) => {
    if (num === undefined || num === null || num === -999) return '-';
    return (num * 100).toFixed(2) + '%';
};

const formatPercentile = (num) => {
    if (num === undefined || num === null) return '-';
    return (num * 100).toFixed(0) + 'th';
};

const MetricRow = ({ label, value, percentile }) => (
    <div className="detail-row">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value}</span>
        <div className="percentile-bar-container">
            <div className="percentile-bar" style={{ width: `${percentile * 100}%` }}></div>
            <span className="percentile-text">{formatPercentile(percentile)} percentile</span>
        </div>
    </div>
);

const StockCard = ({ rank, company }) => {
    const [expanded, setExpanded] = useState(false);
    const isPositive = company.revenue_growth > 0;

    return (
        <div
            className={`stock-card ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
            style={{ cursor: 'pointer', flexDirection: 'column', display: 'flex' }}
        >
            <div className="card-main-row" style={{ display: 'grid', gridTemplateColumns: '80px 3fr 2fr 2fr 2fr 1fr', width: '100%', alignItems: 'center' }}>
                <div className="rank-display">
                    {rank}
                </div>

                <div className="company-info">
                    <h3>{company.company}</h3>
                    <div className="ticker-sector">
                        <span>{company.symbol}</span>
                        <span>•</span>
                        <span>{company.sector}</span>
                    </div>
                </div>

                <div className="metric">
                    <span className="label">Market Cap</span>
                    <span className="value">₹{formatLargeNumber(company.market_cap)}</span>
                </div>

                <div className="metric">
                    <span className="label">Price</span>
                    <span className="value">{formatCurrency(company.price)}</span>
                </div>

                <div className="metric">
                    <span className="label">Revenue</span>
                    <span className="value">₹{formatLargeNumber(company.revenue)}</span>
                </div>

                <div className="score-section">
                    <div className="score-badge">
                        Score: {company.display_score}
                    </div>
                    <div className={`change-indicator ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '↗' : '↘'} {formatPercentage(company.revenue_growth)}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="card-details" style={{ width: '100%', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', animation: 'slideDown 0.2s ease-out' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Ranking Detail Breakdown</h4>

                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="detail-column">
                            <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>Momentum Score: {(company.momentum_score * 100).toFixed(0)}</h5>
                            <MetricRow
                                label="Revenue Growth"
                                value={formatPercentage(company.revenue_growth)}
                                percentile={company.pct_rev_growth}
                            />
                        </div>

                        <div className="detail-column">
                            <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-primary)' }}>Quality Score: {(company.quality_score * 100).toFixed(0)}</h5>
                            <MetricRow
                                label="Return on Assets (ROA)"
                                value={formatPercentage(company.roa)}
                                percentile={company.pct_roa}
                            />
                            <MetricRow
                                label="Debt to Equity"
                                value={company.debt_to_equity !== null && company.debt_to_equity !== undefined ? company.debt_to_equity.toFixed(2) : 'N/A'}
                                percentile={company.pct_debt_equity}
                            />
                            <MetricRow
                                label="Current Ratio"
                                value={company.current_ratio ? company.current_ratio.toFixed(2) : '-'}
                                percentile={company.pct_current_ratio}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockCard;
