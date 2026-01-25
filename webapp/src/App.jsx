import { useState, useEffect } from 'react'
import { Search, Info, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react'
import RankingTable from './components/RankingTable'
import SectorLeaders from './components/SectorLeaders'
import StockDetailModal from './components/StockDetailModal'

function App() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] = useState(null)

  useEffect(() => {
    fetch('/rankings.json')
      .then(res => res.json())
      .then(data => {
        setRankings(data)
        setLoading(false)
      })
      .catch(err => console.error("Failed to load rankings", err))
  }, [])

  const filteredRankings = rankings.filter(stock => {
    const matchesFilter = filter === 'All' ||
      (filter === 'Banks' && stock.category === 'Banking & Finance') ||
      (filter === 'Non-Banks' && stock.category === 'Non-Banking')
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Nifty 50 Rankings
            </h1>
            <p className="text-brand-muted mt-2">
              Automated scoring based on Profitability, Valuation, Stability & Growth.
            </p>
          </div>

          <div className="glass-panel p-1 rounded-lg flex text-sm">
            {['All', 'Banks', 'Non-Banks'].map(Type => (
              <button
                key={Type}
                onClick={() => setFilter(Type)}
                className={`px-4 py-2 rounded-md transition-all ${filter === Type
                    ? 'bg-brand-accent text-white shadow-lg'
                    : 'text-brand-muted hover:text-white'
                  }`}
              >
                {Type}
              </button>
            ))}
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Content (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or ticker..."
                className="w-full bg-brand-card/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-20 text-brand-muted animate-pulse">
                Analyzing market data...
              </div>
            ) : (
              <RankingTable
                data={filteredRankings}
                onRowClick={setSelectedStock}
              />
            )}
          </div>

          {/* Sidebar (1 col) */}
          <div className="lg:col-span-1">
            {!loading && <SectorLeaders data={rankings} />}
          </div>

        </div>

        {/* Detail Modal */}
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      </div>
    </div>
  )
}

export default App
