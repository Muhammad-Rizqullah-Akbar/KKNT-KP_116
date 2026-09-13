'use client'

import { colorSchemes, getWidgetData, resolveOptionText } from './helpers'

type DynamicChartProps = {
  widget: any
  responses: any[]
  selectedFormId: string
}

export default function DynamicChart({ widget, responses, selectedFormId }: DynamicChartProps) {
  const data = getWidgetData(widget, responses, selectedFormId, resolveOptionText)
  const colors = colorSchemes[widget.config?.colorScheme] || colorSchemes.cyan
  const chartType = widget.chartType

  if (chartType === 'bar') {
    const maxVal = Math.max(...data.values, 1)
    return (
      <div className="flex items-end gap-3 h-48 pt-4">
        {data.labels.map((label: string, i: number) => {
          const val = data.values[i] || 0
          const height = (val / maxVal) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-semibold text-white/70">{val}</span>
              <div
                className="w-full max-w-[40px] rounded-t-lg transition-all shadow-lg"
                style={{
                  height: `${Math.max(height, 8)}%`,
                  background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`
                }}
              />
              <span className="text-[10px] text-white/40 truncate w-full text-center">{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (chartType === 'pie') {
    const total = data.values.reduce((a: number, b: number) => a + b, 0) || 1
    let currentAngle = 0
    return (
      <div className="flex items-center gap-6 h-48 justify-center">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
            {data.labels.map((_: string, i: number) => {
              const val = data.values[i] || 0
              const percentage = (val / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              currentAngle = endAngle

              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
              const largeArc = angle > 180 ? 1 : 0

              return (
                <path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[i % colors.length]}
                  opacity={0.9}
                />
              )
            })}
          </svg>
        </div>
        <div className="space-y-1.5 flex-1 max-w-[200px]">
          {data.labels.map((label: string, i: number) => {
            const val = data.values[i] || 0
            const percentage = Math.round((val / total) * 100)
            return (
              <div key={i} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                  <span className="text-white/70 truncate">{label}</span>
                </div>
                <span className="text-white/40 font-mono">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (chartType === 'matrix') {
    const matrixTotal = data.values.reduce((a: number, b: number) => a + b, 0) || 1
    return (
      <div className="space-y-3 h-48 flex flex-col justify-center">
        {data.labels.map((label: string, i: number) => {
          const val = data.values[i] || 0
          const percentage = Math.round((val / matrixTotal) * 100)
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/80 font-medium truncate max-w-[180px]">{label}</span>
                <span className="text-white/40 font-mono">{val} responden ({percentage}%)</span>
              </div>
              <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${percentage}%`, background: colors[i % colors.length] }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}
