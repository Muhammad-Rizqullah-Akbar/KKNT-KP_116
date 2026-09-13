'use client'

import { Icon } from '@/components/ui/Icons'

export interface RespondentIdentity {
  name: string
  phone: string
  email: string
  institution: string
  address: string
}

interface RespondentIdentityCardProps {
  identity: RespondentIdentity
}

export function RespondentIdentityCard({ identity }: RespondentIdentityCardProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Icon name="user" className="w-3.5 h-3.5 text-cyan-400" />
          Identitas Responden (Pengisian Biodata)
        </span>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Status: Terisi & Valid
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block">Nama Responden</span>
          <span className="font-bold text-slate-100 block truncate">{identity.name}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block">Instansi / Sarana</span>
          <span className="font-bold text-slate-100 block truncate">{identity.institution}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block">Lokasi / Alamat</span>
          <span className="font-bold text-slate-100 block truncate">{identity.address}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 block">Kontak / Telp</span>
          <span className="font-bold text-slate-100 block truncate">{identity.phone}</span>
        </div>
      </div>
    </div>
  )
}
