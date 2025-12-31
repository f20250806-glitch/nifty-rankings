import React, { useState, useEffect } from 'react';
import StockCard from './components/StockCard';
import initialData from '../public/data.json';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
  '#0ea5e9', '#22c55e', '#eab308', '#f43f5e', '#a855f7',
  '#d946ef', '#818cf8', '#0d9488', '#fb923c', '#65a30d'
];

function App() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ marketCap: 0, avgGrowth: 0 });
  const [theme, setTheme] = useState('light');
  const [sectorLeaders, setSectorLeaders] = useState([]);

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Data fetch
    fetch('/data.json?t=' + new Date().getTime())
      .then(res => res.json())
      .then(json => {
        setData(json);
        calculateStats(json);
        calculateSectorLeaders(json);
      })
      .catch(err => {
        console.error("Failed to fetch data", err);
        setData(initialData);
        calculateStats(initialData);
        calculateSectorLeaders(initialData);
      });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const calculateStats = (items) => {
    if (!items || items.length === 0) return;
    const totalCap = items.reduce((acc, curr) => acc + (curr.market_cap || 0), 0);
    const avgGrowth = items.reduce((acc, curr) => acc + (curr.revenue_growth || 0), 0) / items.length;

    setStats({
      marketCap: totalCap,
      avgGrowth: avgGrowth
    });
  };

  const calculateSectorLeaders = (items) => {
    // Group by sector
    const sectors = {};
    items.forEach(item => {
      if (!sectors[item.sector]) {
        sectors[item.sector] = [];
      }
      sectors[item.sector].push(item);
    });

    // Find top scorer in each sector
    const leaders = Object.keys(sectors).map(sector => {
      const companies = sectors[sector];
      // Sort by display score descending
      companies.sort((a, b) => b.display_score - a.display_score);
      return {
        name: sector,
        leader: companies[0],
        count: companies.length
      };
    });

    // Sort sectors by their leader's score
    // Sort sectors by their leader's score
    leaders.sort((a, b) => b.leader.display_score - a.leader.display_score);

    // Filter out Unknown sector
    const validLeaders = leaders.filter(l => l.name !== 'Unknown');
    setSectorLeaders(validLeaders);
  };

  const formatLargeNumber = (num) => {
    if (!num) return '-';
    if (num >= 1e7) return (num / 1e7).toFixed(2) + ' Cr';
    if (num >= 1e5) return (num / 1e5).toFixed(2) + ' L';
    return num.toString();
  };

  return (
    <div className="container">
      <header className="header">
        <div className="title-section">
          <h1>
            <span className="badge-icon">🇮🇳</span>
            Nifty 50 Rankings
          </h1>
          <div className="subtitle">Ranked by composite performance score</div>
        </div>

        <div className="header-controls">
          <div className="timestamp">
            Updated: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Dark Mode">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="stat-card">
          <div className="stat-icon money">💲</div>
          <div className="stat-content">
            <div className="label">Total Market Cap</div>
            <div className="value">₹{formatLargeNumber(stats.marketCap)}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Rankings Column */}
        <div className="rankings-list">
          {data.map((company, index) => (
            <StockCard
              key={company.symbol}
              rank={index + 1}
              company={company}
            />
          ))}
        </div>

        {/* Sidebar Column */}
        <aside className="sector-sidebar">
          <h3 className="sidebar-title">
            <span>🏆</span> Top by Sector
          </h3>

          {/* Portfolio Chart */}
          <div style={{ height: '300px', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Ideal Portfolio Allocation (Aggressive)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(() => {
                    // Calculate total for percentage, using cube to exaggerate differences
                    const totalScore = sectorLeaders.reduce((acc, s) => acc + Math.pow(s.leader.display_score, 3), 0);
                    return sectorLeaders.map(s => {
                      const weight = Math.pow(s.leader.display_score, 3);
                      return {
                        name: s.leader.company,
                        value: weight, // Used for slice size
                        originalScore: s.leader.display_score,
                        percent: ((weight / totalScore) * 100).toFixed(1)
                      };
                    });
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorLeaders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                  formatter={(value, name, props) => [
                    `${props.payload.percent}% (Score: ${props.payload.originalScore})`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="sector-list">
            {sectorLeaders.map((s, index) => (
              <div className="sector-item" key={s.name}>
                <div className="sector-header">
                  <span className="sector-name" style={{ color: COLORS[index % COLORS.length] }}>{s.name}</span>
                  {/* <span className="sector-count">{s.count} listed</span> */}
                </div>

                <div className="sector-leader">
                  <div className="leader-name">
                    {s.leader.company}
                  </div>
                  <div className="leader-score" style={{ backgroundColor: COLORS[index % COLORS.length], color: '#fff' }}>
                    {s.leader.display_score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer style={{ marginTop: '3rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        <strong>Ranking Methodology:</strong> Companies are ranked based on a composite score considering Momentum (Revenue Growth) and Quality (ROA, Debt/Equity, Current Ratio).
      </footer>
    </div>
  );
}

export default App;
