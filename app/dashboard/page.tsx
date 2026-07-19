'use client'

import { Topbar } from '@/components/dashboard/Topbar'
import { StatCard } from '@/components/dashboard/StatCard'
import { Icon } from '@/components/ui/Icons'

const stats = [
  {
    label: 'Total Formulir',
    value: '12',
    icon: 'fileText' as const,
    change: { value: '2', type: 'increase' as const },
  },
  {
    label: 'Formulir Aktif',
    value: '8',
    icon: 'checkCircle' as const,
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Total Pengisian',
    value: '347',
    icon: 'users' as const,
    iconColor: 'text-violet-400',
    change: { value: '14%', type: 'increase' as const },
  },
  {
    label: 'Rata-rata Skor',
    value: '74.8',
    icon: 'barChart' as const,
    iconColor: 'text-amber-400',
    subtitle: 'Dari 347 responden',
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Dashboard" subtitle="Ringkasan data dan visualisasi" />

      <div className="flex-1 p-6 space-y-8">
        {/* Stats */}
        <section className="animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        {/* Widget Placeholder */}
        <section className="animate-fadeIn">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Icon name="barChart" className="w-5 h-5 text-cyan-400" />
            Ringkasan Grafik
          </h2>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 min-h-[160px] flex items-center justify-center"
                >
                  <p className="text-white/20 text-sm">Widget {i}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}