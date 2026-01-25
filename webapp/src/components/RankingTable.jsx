import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const MetricBadge = ({ label, value, type = 'neutral' }) => (
    <div className="flex flex-col">
        <span className="text-xs text-brand-muted uppercase tracking-wider">{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
)

export default function RankingTable({ data, onRowClick }) {
    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-brand-muted">
                No stocks found matching your criteria.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-12 px-6 py-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-4 text-right">Key Metrics</div>
            </div>

            <div className="space-y-3">
                {data.map((stock, index) => (
                    <motion.div
                        key={stock.ticker}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onRowClick(stock)}
                        className="glass-panel rounded-xl p-4 grid grid-cols-12 items-center hover:bg-brand-card/90 transition-colors group cursor-pointer active:scale-[0.99]"
                    >
                        <div className="col-span-1">
                            <span className={`
                flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                ${stock.rank <= 5 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-brand-card border border-white/5 text-brand-muted'}
              `}>
                                #{stock.rank}
                            </span>
                        </div>

                        <div className="col-span-3">
                            <span className="inline-block font-mono font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded text-sm mb-1">
                                {stock.ticker.replace('.NS', '')}
                            </span>
                            <h3 className="font-medium text-white text-sm truncate pr-4 leading-tight">{stock.name}</h3>
                            <p className="text-xs text-brand-muted mt-0.5">{stock.sector}</p>
                        </div>

                        <div className="col-span-2">
                            <div className="text-2xl font-bold bg-gradient-to-r from-brand-success to-emerald-400 bg-clip-text text-transparent">
                                {stock.score}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-brand-muted border border-white/5">
                                {stock.category}
                            </span>
                        </div>

                        <div className="col-span-4 flex justify-end gap-6 text-sm text-right">
                            <MetricBadge label="ROE" value={`${stock.metrics.roe}%`} />

                            {/* Dynamic Valuation Metric */}
                            {stock.category === 'Banking & Finance' ? (
                                <MetricBadge label="P/B" value={stock.metrics.pb} />
                            ) : (
                                <MetricBadge label="EV/EBITDA" value={stock.metrics.ev_ebitda} />
                            )}

                            <MetricBadge
                                label="Growth"
                                value={
                                    <span className={stock.metrics.growth >= 0 ? 'text-brand-success' : 'text-red-400'}>
                                        {stock.metrics.growth}%
                                    </span>
                                }
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
