'use client'

import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/ui/Icons'
import { safeFetchJson } from '@/lib/infra/safe-fetch'

interface CostEndpoint {
  key: string
  reads: number
  writes: number
  deletes: number
  costUsdPerRequest: number
  grossCostUsdPerMonth: number
  netCostUsdPerMonth: number
  requestsPerDayUntilFreeTierExhausted: number
  breakdown: Record<string, number>
}

interface CostMonitoringData {
  assumedRequestsPerDay: number
  endpoints: CostEndpoint[]
  totalNetCostUsdPerMonth: number
  freeTierDailyReads: number
  freeTierDailyWrites: number
  freeTierDailyDeletes: number
}

export function CostMonitoringSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cost-monitoring'],
    queryFn: async () => {
      const res = await safeFetchJson<any>('/api/cost/monitoring')
      if (!res.ok || !res.data || !Array.isArray(res.data.endpoints)) throw new Error('Gagal memuat data biaya')
      return res.data as CostMonitoringData
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/40">
        <Icon name="loader" className="w-6 h-6 text-cyan-400 animate-spin mr-3" />
        <span>Menghitung estimasi biaya...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
        Gagal memuat estimasi biaya. Pastikan Anda login sebagai Super Admin.
      </div>
    )
  }

  const isFree = data.totalNetCostUsdPerMonth < 0.0001

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Estimasi Biaya Bulanan (NET)</span>
          <p className={`text-3xl font-black font-mono ${isFree ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {isFree ? '$0.0000' : `$${data.totalNetCostUsdPerMonth.toFixed(4)}`}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {isFree ? 'Sepenuhnya tercakup free tier (gratis)' : 'Setelah free tier harian'}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Free Tier Reads</span>
          <p className="text-2xl font-black font-mono text-emerald-400">{data.freeTierDailyReads.toLocaleString()}/hari</p>
          <span className="text-[10px] text-slate-500 font-mono">Gratis per hari</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Free Tier Writes</span>
          <p className="text-2xl font-black font-mono text-emerald-400">{data.freeTierDailyWrites.toLocaleString()}/hari</p>
          <span className="text-[10px] text-slate-500 font-mono">Gratis per hari</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Asumsi Traffic</span>
          <p className="text-2xl font-black font-mono text-cyan-400">{data.assumedRequestsPerDay} req/hari</p>
          <span className="text-[10px] text-slate-500 font-mono">Dashboard internal</span>
        </div>
      </div>

      {/* Tabel detail endpoint */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-x-auto">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="p-3.5 border-b border-slate-800">Endpoint</th>
              <th className="p-3.5 border-b border-slate-800 text-center">Reads/req</th>
              <th className="p-3.5 border-b border-slate-800 text-center">Writes/req</th>
              <th className="p-3.5 border-b border-slate-800 text-center">Biaya/req (USD)</th>
              <th className="p-3.5 border-b border-slate-800 text-center">Biaya/bln NET (USD)</th>
              <th className="p-3.5 border-b border-slate-800 text-center">Request/hari sblm habis free tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.endpoints.map((e) => (
              <tr key={e.key} className="hover:bg-slate-900/60 transition-colors">
                <td className="p-3.5 font-bold text-slate-100">{e.key}</td>
                <td className="p-3.5 text-center text-cyan-400">{e.reads}</td>
                <td className="p-3.5 text-center text-purple-300">{e.writes}</td>
                <td className="p-3.5 text-center text-slate-300">${e.costUsdPerRequest.toFixed(6)}</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">
                  {e.netCostUsdPerMonth < 0.0001 ? '$0.0000' : `$${e.netCostUsdPerMonth.toFixed(4)}`}
                </td>
                <td className="p-3.5 text-center text-slate-400">
                  {e.requestsPerDayUntilFreeTierExhausted === Infinity
                    ? '∞ (selalu free)'
                    : e.requestsPerDayUntilFreeTierExhausted.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 font-mono">
        Estimasi statis NET (setelah free tier) berdasarkan ukuran koleksi produksi aktual (130 response, 4 form) & asumsi {data.assumedRequestsPerDay} request/hari. Tidak melakukan operasi Firestore tambahan.
      </p>
    </div>
  )
}
