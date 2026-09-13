import { Icon, type IconName } from '@/components/ui/Icons'

interface StatCardProps {
  label: string
  value: string | number
  icon: IconName
  change?: {
    value: string | number
    type: 'increase' | 'decrease'
  }
  subtitle?: string
  iconColor?: string
}

export function StatCard({
  label,
  value,
  icon,
  change,
  subtitle,
  iconColor = 'text-cyan-400',
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <Icon name={icon} className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold font-display">{value}</p>
      {change && (
        <p
          className={`text-xs mt-1 flex items-center gap-1 ${
            change.type === 'increase' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <Icon name="trendingUp" className="w-3 h-3" />
          {change.value} {change.type === 'increase' ? 'naik' : 'turun'}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-white/35 mt-1">{subtitle}</p>
      )}
    </div>
  )
}