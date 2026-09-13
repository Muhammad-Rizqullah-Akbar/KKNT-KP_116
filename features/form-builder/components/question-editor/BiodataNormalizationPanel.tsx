'use client'

import type { BiodataKey } from '@/lib/domain/forms/types'
import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'
import { Icon } from '@/components/ui/Icons'

interface BiodataNormalizationPanelProps {
  question: BuilderQuestion
  onUpdate: (update: Omit<Partial<BuilderQuestion>, 'questionId'>) => void
}

export function BiodataNormalizationPanel({ question, onUpdate }: BiodataNormalizationPanelProps) {
  return (
    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
      <div className="flex items-center gap-2 text-xs text-purple-300 font-bold">
        <Icon name="info" className="w-4 h-4 text-purple-400 shrink-0" />
        <span>Standardisasi Identitas Responden (Biodata Field Normalization):</span>
      </div>
      <p className="text-[11px] text-purple-300/80 leading-relaxed">
        Pilih peran identitas data ini agar otomatis ternormalisasi pada laporan hasil, analisis responden, dan ekspor data tanpa perlu dinilai.
      </p>

      <div className="pt-1">
        <select
          value={question.biodataKey || 'custom_biodata'}
          onChange={(e) => onUpdate({ biodataKey: e.target.value as BiodataKey })}
          className="w-full bg-slate-900 border border-purple-500/40 text-purple-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
        >
          <option value="custom_biodata">Data Informasi Umum / Biodata Lainnya</option>
          <option value="respondent_name">Nama Lengkap Responden (respondent_name)</option>
          <option value="respondent_phone">Nomor Telepon / WhatsApp (respondent_phone)</option>
          <option value="respondent_email">Alamat Email (respondent_email)</option>
          <option value="respondent_institution">Instansi / Organisasi / Nama Sarana (respondent_institution)</option>
          <option value="respondent_address">Alamat Lengkap / Lokasi (respondent_address)</option>
          <option value="source_info">Sumber Informasi / Media (source_info)</option>
        </select>
      </div>
    </div>
  )
}
