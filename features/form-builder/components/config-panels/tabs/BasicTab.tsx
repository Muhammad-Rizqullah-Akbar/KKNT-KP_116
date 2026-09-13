// config-panels/tabs/BasicTab.tsx
// Tab "Dasar" — judul, deskripsi, sifat wajib, penanda biodata.

'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, IDENTIFIER_TYPES } from './../../shared/ElementTypes'

interface BasicTabProps {
  element: FlexibleQuestion
  setElement: (updated: FlexibleQuestion) => void
  validationMode: 'all_required' | 'all_required_except' | 'free'
  validationExceptions: string[]
}

export function BasicTab({
  element,
  setElement,
  validationMode,
  validationExceptions,
}: BasicTabProps) {
  // ===== CEK APAKAH PERTANYAAN TERMASUK EXCEPTION =====
  const isException = (questionId: string): boolean => {
    return validationExceptions.includes(questionId)
  }

  // ===== CEK APAKAH PERTANYAAN WAJIB =====
  const isQuestionRequired = (): boolean => {
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      return !isException(element.id)
    }
    return element.required
  }

  // ===== APAKAH USER BISA MENGUBAH STATUS WAJIB? =====
  const canChangeRequired = (): boolean => {
    if (validationMode === 'all_required') return false
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      return true
    }
    return true
  }

  // ============ GET LABEL MODE VALIDASI ============
  const getValidationModeLabel = (): string => {
    switch (validationMode) {
      case 'all_required': return 'Semua Wajib'
      case 'all_required_except': return 'Kecuali yang Dipilih'
      case 'free': return 'Bebas (Tidak Wajib)'
      default: return 'Semua Wajib'
    }
  }

  const getValidationModeDescription = (): string => {
    switch (validationMode) {
      case 'all_required':
        return '⚡ Semua pertanyaan wajib diisi. Atur di ⚙️ Pengaturan Form → Validasi.'
      case 'all_required_except':
        return '⚡ Hanya pertanyaan yang dipilih yang opsional. Atur di ⚙️ Pengaturan Form → Validasi.'
      case 'free':
        return '⚡ Pertanyaan bersifat opsional. Atur di ⚙️ Pengaturan Form → Validasi.'
      default:
        return '⚡ Semua pertanyaan wajib diisi. Atur di ⚙️ Pengaturan Form → Validasi.'
    }
  }

  const getValidationModeColor = (): string => {
    switch (validationMode) {
      case 'all_required': return 'text-rose-400'
      case 'all_required_except': return 'text-amber-400'
      case 'free': return 'text-emerald-400'
      default: return 'text-rose-400'
    }
  }

  const isRequired = isQuestionRequired()
  const canChange = canChangeRequired()
  const isExceptionQuestion = isException(element.id)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">
          {element.answerType === 'indicator-table' ? 'Judul Tabel' :
           element.answerType === 'signature' ? 'Label Tanda Tangan' :
           'Pertanyaan'} <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={element.question}
          onChange={(e) => setElement({ ...element, question: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
          placeholder={
            element.answerType === 'indicator-table' ? 'Judul tabel pertanyaan...' :
            element.answerType === 'signature' ? 'Label tanda tangan...' :
            'Masukkan pertanyaan...'
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Deskripsi Tambahan (opsional)</label>
        <input
          type="text"
          value={element.description || ''}
          onChange={(e) => setElement({ ...element, description: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
          placeholder="Deskripsi atau instruksi pengerjaan..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
          <span>Sifat Pertanyaan</span>
          <span className="text-[9px] text-white/20 font-normal">
            (mode: <span className={getValidationModeColor()}>{getValidationModeLabel()}</span>)
          </span>
        </label>

        <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 mb-2">
          <div className="flex items-center gap-2">
            <Icon name="info" className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <p className="text-[10px] text-white/40">
              Mode validasi global:
              <span className={`font-medium ml-1 ${getValidationModeColor()}`}>
                {getValidationModeLabel()}
              </span>
            </p>
          </div>
          <p className="text-[9px] text-white/25 mt-0.5 ml-5">
            {getValidationModeDescription()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className={`flex items-center gap-2 text-sm cursor-pointer ${
            !canChange || validationMode === 'all_required'
              ? 'text-white/40 cursor-not-allowed'
              : 'text-white/60 hover:text-white/80'
          }`}>
            <input
              type="radio"
              name="required-radio"
              checked={element.required === true}
              onChange={() => {
                if (canChange) {
                  setElement({ ...element, required: true })
                }
              }}
              disabled={!canChange || validationMode === 'all_required'}
              className={`accent-cyan-400 w-4 h-4 ${
                !canChange || validationMode === 'all_required'
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            />
            <span>Ya, Wajib Diisi</span>
            {(validationMode === 'all_required' || !canChange) && (
              <span className="text-[9px] text-white/20 ml-1">(global)</span>
            )}
          </label>

          <label className={`flex items-center gap-2 text-sm cursor-pointer ${
            !canChange || validationMode === 'free'
              ? 'text-white/40 cursor-not-allowed'
              : 'text-white/60 hover:text-white/80'
          }`}>
            <input
              type="radio"
              name="required-radio"
              checked={element.required === false}
              onChange={() => {
                if (canChange) {
                  setElement({ ...element, required: false })
                }
              }}
              disabled={!canChange || validationMode === 'free'}
              className={`accent-cyan-400 w-4 h-4 ${
                !canChange || validationMode === 'free'
                  ? 'opacity-30 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            />
            <span>Opsional</span>
            {(validationMode === 'free' || !canChange) && (
              <span className="text-[9px] text-white/20 ml-1">(global)</span>
            )}
          </label>

          {validationMode === 'all_required_except' && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full ${
              isExceptionQuestion
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {isExceptionQuestion ? '🔓 Dikecualikan (Opsional)' : '🔒 Wajib (Default)'}
            </span>
          )}

          {element.overridePoints !== null && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ⚡ Override: {element.overridePoints} pts
            </span>
          )}
        </div>

        {validationMode === 'all_required_except' && (
          <div className={`mt-2 p-2 rounded-lg ${
            isExceptionQuestion
              ? 'bg-amber-500/5 border border-amber-500/10'
              : 'bg-rose-500/5 border border-rose-500/10'
          }`}>
            <div className="flex items-center gap-2">
              <Icon name={isExceptionQuestion ? 'checkCircle' : 'alertCircle'}
                className={`w-3.5 h-3.5 ${
                  isExceptionQuestion ? 'text-amber-400' : 'text-rose-400'
                }`
              } />
              <p className={`text-[10px] ${
                isExceptionQuestion ? 'text-amber-400/70' : 'text-rose-400/70'
              }`}>
                {isExceptionQuestion
                  ? '✅ Pertanyaan ini OPSIONAL (telah ditambahkan ke daftar pengecualian di ⚙️ Pengaturan Form → Validasi)'
                  : '🔒 Pertanyaan ini WAJIB (belum ditambahkan ke daftar pengecualian)'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
        <label className="text-xs text-white/50 uppercase tracking-wider">Gunakan Sebagai Penanda Biodata</label>
        <select
          value={element.identifierType || 'none'}
          onChange={(e) => setElement({
            ...element,
            isIdentifier: e.target.value !== 'none',
            identifierType: e.target.value as any,
          })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
        >
          {IDENTIFIER_TYPES.map((type) => (
            <option key={type.value} value={type.value} className="bg-[#0e0e1a]">
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-white/25">Pemetaan otomatis kolom identitas responden pada dashboard laporan.</p>
      </div>
    </div>
  )
}
