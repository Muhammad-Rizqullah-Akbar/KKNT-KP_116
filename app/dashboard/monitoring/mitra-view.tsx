'use client'

import { useState } from 'react'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/features/dashboard/components/modals/ProfileProgressModal'
import type { UserData } from '@/lib/domain/auth/auth-client.service'
import type { CadreMetric, MonitoringStats, UserProfile } from './types'

interface MitraViewProps {
  userData: UserData | null
  userEmail?: string | null
  cadreMetrics: CadreMetric[]
  stats: MonitoringStats
}

export default function MitraView({ userData, userEmail, cadreMetrics, stats }: MitraViewProps) {
  const [selectedCadreForInspect, setSelectedCadreForInspect] = useState<UserProfile | null>(null)

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title={`Monitoring Operasional: ${userData?.organization || userData?.displayName || 'Instansi Mitra'}`}
        subtitle={`Pusat Kendali Monitoring Performa Kader & Kualitas Evaluasi Pangan ${userData?.organization || ''}`}
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* SECTION 1: HERO OVERVIEW & METRICS FOR MITRA */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-100 tracking-wide">
                  {userData?.organization || userData?.displayName || 'Instansi Mitra BPOM'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                  {userData?.partnershipType || 'Sekolah'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PARTNER MONITORING HUB
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Email Login: {userEmail} • Kontak HP/WA: <span className="text-cyan-300 font-bold">{userData?.phone || '-'}</span>
              </p>
            </div>
          </div>

          {/* 4 HIGH-VALUE METRIC PODS FOR MITRA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-mono text-purple-300 uppercase font-bold tracking-wider">Kader Binaan Aktif</span>
              <p className="text-2xl font-bold font-mono text-slate-100">{cadreMetrics.length}</p>
              <span className="text-[10px] text-purple-300 font-mono">Orang Terdaftar</span>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Total Kode Distribusi</span>
              <p className="text-2xl font-bold font-mono text-cyan-300">{stats.totalDists}</p>
              <span className="text-[10px] text-cyan-400 font-mono">Kode Tersebar</span>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-mono text-purple-300 uppercase font-bold tracking-wider">Respon Terkumpul</span>
              <p className="text-2xl font-bold font-mono text-purple-300">{stats.totalResponses}</p>
              <span className="text-[10px] text-slate-400 font-mono">Tanggapan Dikumpulkan</span>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
              <p className="text-2xl font-bold font-mono text-emerald-300">{stats.avgScore}%</p>
              <span className="text-[10px] text-emerald-400 font-mono">Skor Evaluasi Pangan</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: TOP KONTRIBUTOR KADER BINAAN INSTANSI INI */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="award" className="w-5 h-5 text-purple-400" />
              <span>Top Kontributor Kader Binaan Instansi Ini</span>
            </h3>
            <span className="text-xs font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-xl">
              {cadreMetrics.length} Kader Binaan
            </span>
          </div>

          {cadreMetrics.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
              Belum ada kader terdaftar di bawah instansi ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cadreMetrics
                .sort((metricA, metricB) => metricB.respCount - metricA.respCount || metricB.avgScore - metricA.avgScore)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={item.cadre.uid} className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold">
                        RANK #{idx + 1} KADER BEST
                      </span>
                      <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-100 text-sm">{item.cadre.displayName}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{item.cadre.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Respon:</span>
                        <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pass Rate:</span>
                        <span className="font-bold text-emerald-400">{item.passRate}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCadreForInspect(item.cadre)}
                      className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-colors"
                    >
                      Inspeksi Performa →
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* SECTION 3: TABEL PERFORMA & MONITORING SELURUH KADER BINAAN */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Icon name="users" className="w-4 h-4 text-cyan-400" />
                <span>Daftar & Data Performa Monitoring Seluruh Kader Binaan ({cadreMetrics.length})</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Inspeksi jumlah kode distribusi, tanggapan terkumpul, dan rata-rata skor evaluasi kader Anda.
              </p>
            </div>
          </div>

          {cadreMetrics.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800 p-8 space-y-2">
              <Icon name="users" className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">Belum Ada Kader Terdaftar Untuk Instansi Ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                    <th className="p-3.5 border-b border-slate-800">Email Login</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Kode Distribusi</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Respon Dikumpulkan</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Rata-Rata Nilai</th>
                    <th className="p-3.5 border-b border-slate-800 text-right">Aksi Inspeksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {cadreMetrics.map((item) => (
                    <tr key={item.cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-100">{item.cadre.displayName}</td>
                      <td className="p-3.5 text-slate-400">{item.cadre.email}</td>
                      <td className="p-3.5 text-center font-bold text-slate-300">{item.distCount} Kode</td>
                      <td className="p-3.5 text-center font-bold text-cyan-300">{item.respCount} Respon</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">
                        {item.respCount > 0 ? `${item.avgScore}%` : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedCadreForInspect(item.cadre)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                        >
                          Inspeksi Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INSPECTION PROGRESS MODAL */}
        {selectedCadreForInspect && (
          <ProfileProgressModal
            isOpen={Boolean(selectedCadreForInspect)}
            onClose={() => setSelectedCadreForInspect(null)}
            userOverride={{
              uid: selectedCadreForInspect.uid,
              displayName: selectedCadreForInspect.displayName,
              email: selectedCadreForInspect.email,
              role: selectedCadreForInspect.role,
              organization: selectedCadreForInspect.organization,
              partnershipType: selectedCadreForInspect.partnershipType,
            }}
          />
        )}
      </main>
    </div>
  )
}
