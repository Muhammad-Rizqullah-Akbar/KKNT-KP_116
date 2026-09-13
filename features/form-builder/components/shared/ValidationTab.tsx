'use client'

import { 
  FormValidation, 
  FlexibleQuestion,
  ANSWER_TYPES,
} from './../shared/ElementTypes'

interface ValidationTabProps {
  validation: FormValidation
  elements: FlexibleQuestion[]
  onValidationModeChange: (mode: FormValidation['mode']) => void
  onExceptionToggle: (questionId: string) => void
  onAllowOverrideToggle: () => void
}

export function ValidationTab({
  validation,
  elements,
  onValidationModeChange,
  onExceptionToggle,
  onAllowOverrideToggle,
}: ValidationTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Mode Validasi</h4>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="all_required"
              checked={validation.mode === 'all_required'}
              onChange={() => onValidationModeChange('all_required')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Semua pertanyaan wajib diisi</p>
              <p className="text-xs text-white/30">User harus menjawab semua pertanyaan</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="all_required_except"
              checked={validation.mode === 'all_required_except'}
              onChange={() => onValidationModeChange('all_required_except')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Semua wajib, kecuali...</p>
              <p className="text-xs text-white/30">Pilih pertanyaan yang tidak wajib</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="free"
              checked={validation.mode === 'free'}
              onChange={() => onValidationModeChange('free')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Bebas (tidak wajib)</p>
              <p className="text-xs text-white/30">User bisa skip pertanyaan</p>
            </div>
          </label>
        </div>
      </div>

      {/* Exceptions List */}
      {validation.mode === 'all_required_except' && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">
            Pertanyaan yang Tidak Wajib ({validation.exceptions.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {elements.length === 0 ? (
              <p className="text-xs text-white/30">Belum ada pertanyaan</p>
            ) : (
              elements.map((el) => (
                <label key={el.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation.exceptions.includes(el.id)}
                    onChange={() => onExceptionToggle(el.id)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span className="text-sm text-white/60 truncate flex-1">
                    {el.question || `Pertanyaan ${el.order + 1}`}
                  </span>
                  <span className="text-xs text-white/20 flex-shrink-0">
                    {ANSWER_TYPES.find(t => t.value === el.answerType)?.label || el.answerType}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={validation.allowOverride}
            onChange={onAllowOverrideToggle}
            className="w-4 h-4 rounded text-cyan-500"
          />
          <div>
            <p className="text-sm text-white/80">Izinkan override per pertanyaan</p>
            <p className="text-xs text-white/30">Setiap pertanyaan bisa diatur wajib/tidak secara individual</p>
          </div>
        </label>
      </div>
    </div>
  )
}
