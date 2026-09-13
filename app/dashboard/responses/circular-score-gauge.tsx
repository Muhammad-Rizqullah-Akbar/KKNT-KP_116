'use client'

// CIRCULAR SCORE DONUT GAUGE COMPONENT (NO COLLISION TYPOGRAPHY LAYOUT)
export default function CircularScoreGauge({ score, grade }: { score: number; grade: string }) {
  const size = 88
  const stroke = 7
  const center = size / 2 // 44
  const radius = center - stroke // 37
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#06b6d4' : '#f59e0b'
  const badgeClass =
    score >= 80
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : score >= 60
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-22 h-22 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-22 h-22">
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={center}
            cy={center}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={radius}
            cx={center}
            cy={center}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none font-mono">
          <span className="text-xl font-black text-slate-100 leading-none">{score}%</span>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold tracking-wider uppercase border text-center max-w-[100px] truncate shadow-sm ${badgeClass}`}
        title={grade}
      >
        {grade}
      </span>
    </div>
  )
}
