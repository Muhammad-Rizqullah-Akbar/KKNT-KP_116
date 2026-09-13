'use client'

import { Icon } from '@/components/ui/Icons'
import type { WidgetItem, ChartData } from './widgets-utils'

interface WidgetChartPanelProps {
  widget: WidgetItem
  data: ChartData
  colors: string[]
}

// Chart Component Render Engine — pure presentational renderer for a single widget.
export function WidgetChartPanel({ widget, data, colors }: WidgetChartPanelProps) {
  switch (widget.chartType) {
    case 'bar': {
      const displayLabels = data.labels.slice(0, 4)
      const displayValues = data.values.slice(0, 4)
      const maxVal = Math.max(...(displayValues || [1]), 1)

      return (
        <div className="w-full h-40 flex items-end justify-around gap-2 px-1 pt-4 pb-1 overflow-hidden">
          {displayLabels.map((label, idx) => {
            const val = displayValues[idx] || 0
            const barHeightPct = Math.min(Math.max((val / maxVal) * 100, 15), 100)
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group/bar">
                <span className="text-[10px] font-mono font-bold text-cyan-300 mb-1">
                  {val}
                </span>
                <div
                  className="w-full max-w-[32px] rounded-t-lg transition-all duration-300 shadow group-hover/bar:brightness-125"
                  style={{
                    height: `${barHeightPct}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
                <span className="text-[9px] text-slate-300 font-medium leading-tight text-center w-full mt-1.5 line-clamp-2 break-words">
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    case 'pie': {
      const displayLabels = data.labels.slice(0, 3)
      const displayValues = data.values.slice(0, 3)
      const total = displayValues.reduce((a, b) => a + b, 0) || 1

      return (
        <div className="w-full h-40 flex items-center justify-between gap-3 p-2 overflow-hidden">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {displayValues.map((val, idx) => {
                const pct = (val / total) * 100
                const dashArray = `${pct} ${100 - pct}`
                const accumPct = displayValues.slice(0, idx).reduce((a, b) => a + b, 0)
                const offset = 100 - (accumPct / total) * 100
                return (
                  <circle
                    key={idx}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke={colors[idx % colors.length]}
                    strokeWidth="4.2"
                    strokeDasharray={dashArray}
                    strokeDashoffset={offset}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-extrabold text-slate-100 font-mono">{total}</span>
              <span className="text-[8px] text-slate-400">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 min-w-0 overflow-hidden">
            {displayLabels.map((label, idx) => {
              const val = displayValues[idx] || 0
              const pct = Math.round((val / total) * 100)
              return (
                <div key={idx} className="flex items-center justify-between gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="text-slate-300 font-medium truncate">{label}</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-bold flex-shrink-0 ml-1">
                    {val} <span className="text-slate-500 text-[9px]">({pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'line': {
      const displayLabels = data.labels.slice(0, 4)
      const displayValues = data.values.slice(0, 4)
      const maxVal = Math.max(...(displayValues || [1]), 1)
      const points = displayValues
        .map((v, i) => {
          const x = (i / Math.max(displayValues.length - 1, 1)) * 100
          const y = 85 - (v / maxVal) * 70
          return `${x},${y}`
        })
        .join(' ')

      return (
        <div className="w-full h-40 flex flex-col justify-between p-2 overflow-hidden">
          <div className="relative flex-1 w-full pt-1 overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden">
              <polygon
                fill={`${colors[0]}22`}
                points={`0,100 ${points} 100,100`}
              />
              <polyline
                fill="none"
                stroke={colors[0]}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {displayValues.map((v, i) => {
                const x = (i / Math.max(displayValues.length - 1, 1)) * 100
                const y = 85 - (v / maxVal) * 70
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={colors[i % colors.length]}
                    stroke="#070913"
                    strokeWidth="1.5"
                  />
                )
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-800/80 gap-1 overflow-hidden">
            {displayLabels.map((lbl, idx) => (
              <span key={idx} className="truncate text-center flex-1">
                {lbl}
              </span>
            ))}
          </div>
        </div>
      )
    }

    case 'number': {
      const total = data.values.reduce((a, b) => a + b, 0)
      const primaryVal = data.values[0] || total

      return (
        <div className="w-full h-40 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 text-center overflow-hidden">
          <span className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            {primaryVal}
          </span>
          <div className="mt-1.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            <Icon name="trendingUp" className="w-3 h-3" />
            <span>Respon Terverifikasi</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-2 font-medium line-clamp-2 break-words max-w-xs">
            {widget.config?.title || widget.questionText}
          </p>
        </div>
      )
    }

    case 'matrix':
    default: {
      const displayLabels = data.labels.slice(0, 3)
      const displayValues = data.values.slice(0, 3)
      const total = displayValues.reduce((a, b) => a + b, 0) || 1

      return (
        <div className="w-full h-40 flex flex-col justify-center space-y-2.5 p-2 overflow-hidden">
          {displayLabels.map((label, idx) => {
            const val = displayValues[idx] || 0
            const pct = Math.round((val / total) * 100)
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300 truncate max-w-[170px]">{label}</span>
                  <span className="text-cyan-300 font-bold">{val} ({pct}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(pct, 5)}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )
    }
  }
}
