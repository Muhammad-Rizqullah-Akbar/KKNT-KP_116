'use client'

import { Icon } from '@/components/ui/Icons'
import type { User } from 'firebase/auth'
import type { UserData } from '@/lib/domain/auth/auth-client.service'
import type { UserProfile, CadreProgressSummary, MitraProgressSummary } from './types'

type MitraViewProps = {
  user: User | null
  userData: UserData | null
  filteredCadres: UserProfile[]
  currentMitraSummary: MitraProgressSummary | null
  getCadreProgressSummary: (cadreUid: string) => CadreProgressSummary
  onOpenCreateCadreModal: () => void
  onInspectCadre: (cadre: UserProfile) => void
}

export default function MitraView({
  user,
  userData,
  filteredCadres,
  currentMitraSummary,
  getCadreProgressSummary,
  onOpenCreateCadreModal,
  onInspectCadre,
}: MitraViewProps) {
  return (
    <div className="space-y-6">
      {/* SECTION 1: PROFIL & METRIK INSTANSI MITRA */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-emerald-500 p-1 shrink-0 shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-extrabold text-white">
                {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-100">
                  {userData?.organization || userData?.displayName || 'Instansi Mitra BPOM'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                  {userData?.partnershipType || 'Sekolah'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PARTNER OPERATIONAL HUB
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Email Login: {user?.email} • Kontak HP/WA: <span className="text-cyan-300 font-bold">{userData?.phone || '-'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateCadreModal}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <Icon name="userPlus" className="w-4 h-4" />
            <span>+ Daftarkan Kader Baru</span>
          </button>
        </div>

        {/* 4 HIGH-VALUE METRIC PODS FOR MITRA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kader Binaan Aktif</span>
              <Icon name="users" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100">{filteredCadres.length}</p>
            <span className="text-[10px] text-purple-300 font-mono">Kader Terdaftar</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kode Distribusi Aktif</span>
              <Icon name="send" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-cyan-300">{currentMitraSummary?.totalDists || 0}</p>
            <span className="text-[10px] text-cyan-400 font-mono">Instrumen Kuesioner</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Respon Survei Terkumpul</span>
              <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-purple-300">{currentMitraSummary?.totalResponses || 0}</p>
            <span className="text-[10px] text-slate-500 font-mono">Hasil Responden</span>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Artikel & Views</span>
              <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300">{currentMitraSummary?.totalArticles || 0}</p>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Icon name="eye" className="w-3 h-3 text-emerald-400" />
              {currentMitraSummary?.totalArticleViews || 0} Total Views
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAFTAR & DATA KADER LAPANGAN BINAAN */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="users" className="w-4 h-4 text-cyan-400" />
              <span>Daftar Kader Lapangan Binaan Instansi ({filteredCadres.length} Orang)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Kader resmi yang terikat di bawah manajemen {userData?.organization || userData?.displayName}.
            </p>
          </div>

          <button
            onClick={onOpenCreateCadreModal}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <Icon name="userPlus" className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Tambah Kader</span>
          </button>
        </div>

        {filteredCadres.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-2xl border border-slate-800 p-8 space-y-2">
            <Icon name="users" className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">Belum Ada Kader Terdaftar Untuk Instansi Ini</p>
            <p className="text-[11px] text-slate-500">Klik "+ Tambah Kader" untuk mendaftarkan kader binaan pertama Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                  <th className="p-3.5 border-b border-slate-800">Email Login</th>
                  <th className="p-3.5 border-b border-slate-800">No. HP / WA</th>
                  <th className="p-3.5 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCadres.map((cadre) => (
                  <tr key={cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{cadre.displayName}</div>
                      <div className="text-[10px] text-purple-300 font-mono">ID: {cadre.uid.substring(0, 8)}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">{cadre.email}</td>
                    <td className="p-3.5 text-slate-400">{cadre.phone || '-'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onInspectCadre(cadre)}
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

      {/* SECTION 3: BREAKDOWN AKTIVITAS & CAPAIAN LAPANGAN KADER */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
            <span>Breakdown Aktivitas & Capaian Lapangan Per-Kader Binaan</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Rincian penulisan artikel edukasi CMS, total views pembaca, jumlah kode instrumen, dan respon survei.
          </p>
        </div>

        {filteredCadres.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-xl border border-slate-800">
            Belum ada data kader untuk menampilkan breakdown aktivitas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                  <th className="p-3.5 border-b border-slate-800">Email Login</th>
                  <th className="p-3.5 border-b border-slate-800">Status Artikel CMS</th>
                  <th className="p-3.5 border-b border-slate-800">Views Artikel</th>
                  <th className="p-3.5 border-b border-slate-800">Kode Dibuat</th>
                  <th className="p-3.5 border-b border-slate-800">Respon Terjaring</th>
                  <th className="p-3.5 border-b border-slate-800 text-right">Detail Inspeksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCadres.map((cadre) => {
                  const prog = getCadreProgressSummary(cadre.uid)
                  return (
                    <tr key={cadre.uid} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-100">{cadre.displayName}</td>
                      <td className="p-3.5 text-slate-400">{cadre.email}</td>
                      <td className="p-3.5">
                        {prog.hasWrittenArticle ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Icon name="fileText" className="w-3 h-3 text-emerald-400" />
                            {prog.articleCount} Artikel Diterbitkan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] flex items-center gap-1 w-fit">
                            <Icon name="xCircle" className="w-3 h-3 text-slate-500" />
                            Belum Buat Artikel
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {prog.articleViews > 0 ? (
                          <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                            <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                            {prog.articleViews} Views
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">0 Views</span>
                        )}
                      </td>
                      <td className="p-3.5 text-cyan-400 font-bold">{prog.distCount} Kode</td>
                      <td className="p-3.5 text-purple-300 font-bold">{prog.respCount} Respon</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onInspectCadre(cadre)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                        >
                          Inspeksi
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
