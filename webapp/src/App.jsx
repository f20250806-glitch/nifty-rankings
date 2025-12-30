import React, { useState, useEffect } from 'react';
import StockCard from './components/StockCard';
import initialData from '../public/data.json';

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

          <div className="sector-list">
            {sectorLeaders.map(s => (
              <div className="sector-item" key={s.name}>
                <div className="sector-header">
                  <span className="sector-name">{s.name}</span>
                  {/* <span className="sector-count">{s.count} listed</span> */}
                </div>

                <div className="sector-leader">
                  <div className="leader-name">
                    {s.leader.company}
                  </div>
                  <div className="leader-score">
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
