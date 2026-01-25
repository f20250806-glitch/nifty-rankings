import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StockDetailModal({ stock, onClose }) {
    if (!stock) return null

    // Helper to get color based on percentile
    const getPercentileColor = (p) => {
        if (p >= 80) return 'bg-brand-success'
        if (p >= 40) return 'bg-brand-accent'
        return 'bg-red-500' // Bad percentile
    }

    const metricsToShow = [
        { label: 'ROE', key: 'roe', suffix: '%' },
        { label: 'ROA', key: 'roa', suffix: '%' },
        { label: 'P/B', key: 'pb', suffix: '' },
        { label: 'EV/EBITDA', key: 'ev_ebitda', suffix: '' },
        { label: 'Margins', key: 'margins', suffix: '%' },
        { label: 'Debt/Equity', key: 'de', suffix: '%' },
        { label: '1Y Return', key: 'momentum', suffix: '%' },
    ]

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()} // Prevent close on click inside
                    className="bg-brand-card w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6 relative overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-brand-muted hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-white mb-1">{stock.name}</h2>
                        <div className="flex gap-3 items-center text-sm text-brand-muted">
                            <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/30">{stock.ticker}</span>
                            <span>{stock.sector}</span>
                            <div className="w-1 h-1 rounded-full bg-brand-muted" />
                            <span className={stock.category === 'Banking & Finance' ? 'text-yellow-400' : 'text-blue-400'}>{stock.category}</span>
                        </div>
                    </div>

                    {/* Score Summary */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-8">
                        <div>
                            <p className="text-brand-muted text-sm uppercase tracking-wider font-semibold">Overall Score</p>
                            <div className="text-4xl font-bold text-white mt-1">{stock.score}</div>
                        </div>
                        <div className="text-right">
                            <p className="text-brand-muted text-sm uppercase tracking-wider font-semibold">Rank</p>
                            <div className="text-4xl font-bold text-brand-accent mt-1">#{stock.rank}</div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-lg font-semibold text-white mb-2">Detailed Percentile Rankings</h3>
                        <p className="text-xs text-brand-muted mb-4">
                            Percentiles indiciate how this stock compares to the rest of the Nifty 50.
                            Higher bar is always "Better" (e.g. Lower P/E = Higher Percentile).
                        </p>

                        {/* Legend */}
                        <div className="flex gap-4 mb-6 text-xs text-brand-muted">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-brand-success" />
                                <span>Top Tier ({'>'}80th %)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-brand-accent" />
                                <span>Average (40-80th %)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Below Avg ({'<'}40th %)</span>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {metricsToShow.map(({ label, key, suffix }) => {
                                const value = stock.metrics[key]
                                const percentile = stock.percentiles ? stock.percentiles[key] : 0

                                // Skip missing metrics
                                if (value === undefined || value === null) return null

                                return (
                                    <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-muted font-medium w-24">{label}</span>
                                            <span className="text-white font-bold">{value}{suffix}</span>
                                            <span className="text-brand-muted text-xs w-16 text-right">{percentile}th %</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentile}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className={`h-full ${getPercentileColor(percentile)} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    )
}
