import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

export default function SectorLeaders({ data }) {
    // Group by sector and find max score
    const leaders = data.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized'
        if (!acc[sector] || stock.score > acc[sector].score) {
            acc[sector] = stock
        }
        return acc
    }, {})

    // Convert to array and sort by score descending
    const sortedLeaders = Object.values(leaders).sort((a, b) => b.score - a.score)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-brand-accent mb-4">
                <Trophy className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Sector Leaders</h2>
            </div>

            <div className="space-y-3">
                {sortedLeaders.map((stock, index) => (
                    <motion.div
                        key={stock.sector}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-panel p-4 rounded-xl hover:bg-brand-card/80 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-brand-muted uppercase font-semibold tracking-wider">
                                {stock.sector}
                            </span>
                            <span className="text-sm font-bold text-brand-success">
                                {stock.score}
                            </span>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <span className="inline-block font-mono font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-1.5 py-0.5 rounded text-xs mb-1">
                                    {stock.ticker.replace('.NS', '')}
                                </span>
                                <p className="text-xs text-brand-muted truncate max-w-[120px]">
                                    {stock.name}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
