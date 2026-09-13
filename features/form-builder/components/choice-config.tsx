// components/form-builder/choice-config.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { ConfigPanelProps } from './config-panel-props'

interface ChoiceConfigProps extends ConfigPanelProps {
  type: string
}

export function ChoiceConfig({ type, config, element, onUpdate }: ChoiceConfigProps) {
  const isMultiple = type === 'multiple-choice'
  const correctAnswer = config.correctAnswer
  const isCorrect = (opt: string) => {
    if (isMultiple && Array.isArray(correctAnswer)) {
      return correctAnswer.includes(opt)
    }
    return opt === correctAnswer
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
          <span>Pengaturan Opsi Pilihan</span>
          <button
            type="button"
            onClick={() => {
              const newOptions = [...(config.options || []), `Opsi ${(config.options || []).length + 1}`]
              onUpdate({ ...element, config: { ...config, options: newOptions } })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Icon name="plus" className="w-3 h-3" /> Tambah Opsi
          </button>
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {(config.options || []).map((opt: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-white/20 w-5 shrink-0">{index + 1}.</span>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(config.options || [])]
                  newOptions[index] = e.target.value
                  onUpdate({ ...element, config: { ...config, options: newOptions } })
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                placeholder={`Opsi ${index + 1}`}
              />
              {isCorrect(opt) && (
                <span className="text-[10px] text-emerald-400 font-medium shrink-0">✅ Benar</span>
              )}
              <button
                type="button"
                onClick={() => {
                  const newOptions = (config.options || []).filter((_: string, i: number) => i !== index)
                  onUpdate({ ...element, config: { ...config, options: newOptions } })
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
              >
                <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KUNCI JAWABAN */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">
          {isMultiple ? 'Kunci Jawaban (Pilih yang benar)' : 'Kunci Jawaban Kompetensi'}
        </label>
        <div className="space-y-1.5">
          {(config.options || []).map((opt: string, i: number) => {
            const isChecked = isCorrect(opt)
            return (
              <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                isChecked ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/[0.03]'
              }`}>
                <input
                  type={isMultiple ? 'checkbox' : 'radio'}
                  name={`correct-answer-${element.id}`}
                  checked={isChecked}
                  onChange={() => {
                    let newCorrectAnswer: string | string[] | undefined
                    if (isMultiple) {
                      const current = Array.isArray(config.correctAnswer) ? config.correctAnswer : []
                      newCorrectAnswer = isChecked
                        ? current.filter((v: string) => v !== opt)
                        : [...current, opt]
                    } else {
                      newCorrectAnswer = isChecked ? undefined : opt
                    }
                    onUpdate({
                      ...element,
                      config: { ...config, correctAnswer: newCorrectAnswer }
                    })
                  }}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
                <span className={`text-sm ${isChecked ? 'text-white/90' : 'text-white/50'}`}>{opt}</span>
                {isChecked && (
                  <span className="ml-auto text-[10px] text-emerald-400">
                    {isMultiple ? '✅ Benar' : '✅ Kunci'}
                  </span>
                )}
              </label>
            )
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-1">
          {isMultiple
            ? 'Pilih semua opsi yang merupakan jawaban benar (Partial scoring)'
            : 'Pilih satu opsi sebagai jawaban benar'}
        </p>
      </div>

      {/* BOBOT JAWABAN */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Bobot Jawaban Benar</label>
          <input
            type="number"
            value={config.scoreCorrect ?? 1}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, scoreCorrect: parseInt(e.target.value) || 1 }
            })}
            min={0}
            max={100}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Bobot Jawaban Salah</label>
          <input
            type="number"
            value={config.scoreIncorrect ?? 0}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, scoreIncorrect: parseInt(e.target.value) || 0 }
            })}
            min={0}
            max={100}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
      </div>
      {isMultiple && Array.isArray(config.correctAnswer) && config.correctAnswer.length > 0 && (
        <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-[10px] text-cyan-400">
            💡 Total jawaban benar: {config.correctAnswer.length} opsi
            {config.scoreCorrect !== undefined && ` · Nilai per opsi: ${(config.scoreCorrect / config.correctAnswer.length).toFixed(2)} poin`}
          </p>
        </div>
      )}
    </div>
  )
}
