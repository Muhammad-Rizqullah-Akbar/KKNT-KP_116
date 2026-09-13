'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, IndicatorItem, IndicatorScale } from './../shared/ElementTypes'
import { SignaturePad } from './../media-viewers/SignaturePad'
import { PreviewMedia } from './PreviewMedia'

interface QuestionRendererProps {
  question: FlexibleQuestion
  index: number
  isRequired: boolean
  previewAnswers: Record<string, any>
  filePreviews: Record<string, string>
  onAnswerChange: (questionId: string, value: any) => void
  onSimulatedFileUpload: (questionId: string, file: File | null) => void
  onOpenLightbox: (image: { src: string; alt: string }) => void
  onOpenPdf: (pdf: { src: string; fileName: string }) => void
  onOpenVideo: (video: { src: string; caption?: string }) => void
  onDownload: (url: string, fileName?: string) => void
}

export function QuestionRenderer({
  question,
  index,
  isRequired,
  previewAnswers,
  filePreviews,
  onAnswerChange,
  onSimulatedFileUpload,
  onOpenLightbox,
  onOpenPdf,
  onOpenVideo,
  onDownload,
}: QuestionRendererProps) {
  const answerType = question.answerType
  const config = question.config
  const requiredMark = isRequired ? <span className="text-rose-400 ml-1">*</span> : null
  const currentAnswer = previewAnswers[question.id]

  const mediaProps = {
    onOpenLightbox,
    onOpenPdf,
    onOpenVideo,
    onDownload,
  }

  switch (answerType) {
    case 'single-choice':
    case 'dropdown':
      return (
        <div key={question.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          {answerType === 'single-choice' ? (
            <div className="space-y-2">
              {(config.options || []).map((opt: string, i: number) => (
                <label key={`${question.id}-option-${i}`} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                  <input type="radio" name={`preview-${question.id}`} checked={currentAnswer === opt} onChange={() => onAnswerChange(question.id, opt)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
                </label>
              ))}
            </div>
          ) : (
            <select value={currentAnswer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} className="w-full max-w-75 px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer">
              <option value="" className="bg-[#0e0e1a] text-white/40">Pilih opsi...</option>
              {(config.options || []).map((opt: string, i: number) => (<option key={`${question.id}-dropdown-${i}`} value={opt} className="bg-[#0e0e1a]">{opt}</option>))}
            </select>
          )}
        </div>
      )

    case 'multiple-choice': {
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : []
      return (
        <div key={question.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <div className="space-y-2">
            {(config.options || []).map((opt: string, i: number) => (
              <label key={`${question.id}-checkbox-${i}`} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={selectedOptions.includes(opt)} onChange={(e) => {
                  if (e.target.checked) onAnswerChange(question.id, [...selectedOptions, opt])
                  else onAnswerChange(question.id, selectedOptions.filter((v: string) => v !== opt))
                }} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
              </label>
            ))}
          </div>
        </div>
      )
    }

    case 'short-text':
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <input type="text" value={currentAnswer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban Anda di sini...'} className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
        </div>
      )

    case 'long-text':
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <textarea value={currentAnswer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban panjang Anda di sini...'} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none" />
        </div>
      )

    case 'indicator-table': {
      const indicators: IndicatorItem[] = config.indicators || []
      const scales: IndicatorScale[] = config.indicatorScales || []
      const indicatorTitle = config.indicatorTitle || 'Pertanyaan'
      const showTotal = config.showTotalScore || false
      const showWeighted = config.showWeightedScore || false

      if (indicators.length === 0 || scales.length === 0) {
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
            <PreviewMedia question={question} {...mediaProps} />
            <div className="p-4 rounded-xl border-2 border-dashed border-white/8 text-center">
              <Icon name="table" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">{indicators.length === 0 ? 'Belum ada pertanyaan' : 'Belum ada skala jawaban'}</p>
            </div>
          </div>
        )
      }

      const calculateTotal = () => {
        let total = 0
        indicators.forEach((indicator: IndicatorItem, i: number) => {
          const rowKey = `${question.id}-${i}`
          const selLabel = previewAnswers[rowKey]
          const selScale = scales.find((s: IndicatorScale) => s.label === selLabel)
          const selValue = selScale?.value || 0
          const w = indicator.weight || 1
          total += showWeighted ? selValue * w : selValue
        })
        return total
      }

      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          {question.description && <p className="text-xs text-white/40">{question.description}</p>}
          <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/3">
                  <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5 w-10">#</th>
                  <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5 min-w-37.5">{indicatorTitle}</th>
                  {scales.map((scale: IndicatorScale, i: number) => (
                    <th key={`${question.id}-scale-header-${i}`} className="text-center text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5">{scale.label}</th>
                  ))}
                  {showTotal && <th className="text-center text-xs text-white/40 font-medium py-2.5 px-3">Skor</th>}
                </tr>
              </thead>
              <tbody>
                {indicators.map((indicator: IndicatorItem, i: number) => {
                  const rowKey = `${question.id}-${i}`
                  const selectedScale = previewAnswers[rowKey]
                  const selScale = scales.find((s: IndicatorScale) => s.label === selectedScale)
                  const selValue = selScale?.value || 0
                  const weight = indicator.weight || 1
                  const rowScore = showWeighted ? selValue * weight : selValue
                  return (
                    <tr key={`${question.id}-row-${indicator.id || i}`} className="border-t border-white/3 hover:bg-white/1 transition-colors">
                      <td className="py-2.5 px-3 text-white/30 text-xs border-r border-white/5 text-center">{i + 1}</td>
                      <td className="py-2.5 px-3 text-white/70 text-xs border-r border-white/5">
                        {indicator.label}
                        {showWeighted && weight !== 1 && <span className="text-[10px] text-cyan-400/60 ml-1">(×{weight})</span>}
                      </td>
                      {scales.map((scale: IndicatorScale, j: number) => (
                        <td key={`${question.id}-cell-${i}-${j}`} className="text-center py-2.5 px-3 border-r border-white/5">
                          <input type="radio" name={`preview-indicator-${rowKey}`} checked={previewAnswers[rowKey] === scale.label} onChange={() => onAnswerChange(rowKey, scale.label)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />
                        </td>
                      ))}
                      {showTotal && (
                        <td className="text-center py-2.5 px-3">
                          <span className={`text-xs font-mono ${selValue > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{selValue > 0 ? rowScore : '-'}</span>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {showTotal && (
                  <tr className="border-t border-white/8 bg-white/2 font-medium">
                    <td colSpan={2} className="py-3 px-3 text-white/60 text-xs text-right border-r border-white/5">Total Skor</td>
                    {scales.map((_: IndicatorScale, i: number) => (<td key={`${question.id}-total-${i}`} className="border-r border-white/5"></td>))}
                    <td className="text-center py-3 px-3"><span className="text-sm text-cyan-400 font-bold">{calculateTotal() > 0 ? calculateTotal() : '-'}</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    case 'rating': {
      const ratingVal = Number(currentAnswer) || 0
      const maxStars = config.ratingMax || 5
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <div className="flex gap-2.5 items-center">
            {Array.from({ length: maxStars }, (_: any, i: number) => {
              const starIndex = i + 1
              return (
                <button key={`${question.id}-star-${i}`} type="button" onClick={() => onAnswerChange(question.id, starIndex)} className={`text-3xl transition-all hover:scale-110 ${starIndex <= ratingVal ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white/20'}`}>★</button>
              )
            })}
            {ratingVal > 0 && <span className="text-xs text-white/40 ml-2">({ratingVal} / {maxStars})</span>}
          </div>
        </div>
      )
    }

    case 'number':
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <input type="number" value={currentAnswer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} min={config.min} max={config.max} step={config.step} placeholder="0" className="w-full max-w-37.5 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
        </div>
      )

    case 'date':
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <input type="date" value={currentAnswer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} className="w-full max-w-50 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer" />
        </div>
      )

    case 'file-upload': {
      const simulatedUrl = filePreviews[question.id]
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          <input type="file" id={`file-input-${question.id}`} accept={(config.fileTypes || []).join(',')} onChange={(e) => { const file = e.target.files?.[0] || null; onSimulatedFileUpload(question.id, file) }} className="hidden" />
          <label htmlFor={`file-input-${question.id}`} className="block p-5 rounded-xl border-2 border-dashed border-white/8 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-center cursor-pointer transition-all">
            <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">{currentAnswer ? `File terpilih: ${currentAnswer}` : 'Klik area ini untuk simulasi upload file'}</p>
            <p className="text-[10px] text-white/20 mt-1">Maksimal file {config.maxFileSize || 5}MB. Mendukung: {(config.fileTypes || ['image/*', 'application/pdf']).join(', ')}</p>
          </label>
          {simulatedUrl && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-white/8 max-w-xs mx-auto group cursor-pointer" onClick={() => onOpenLightbox({ src: simulatedUrl, alt: currentAnswer || 'Preview' })}>
              <img src={simulatedUrl} alt="Simulated Preview" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-center"><Icon name="search" className="w-8 h-8 text-white mx-auto" /><p className="text-[10px] text-white mt-1">Klik untuk zoom penuh</p></div>
              </div>
            </div>
          )}
        </div>
      )
    }

    case 'signature':
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tanda Tangan'} {requiredMark}</p>
          <PreviewMedia question={question} {...mediaProps} />
          {question.description && <p className="text-xs text-white/40">{question.description}</p>}
          <SignaturePad
            width={config.signatureWidth || 400}
            height={config.signatureHeight || 200}
            penColor={config.signaturePenColor || '#000000'}
            bgColor={config.signatureBgColor || '#ffffff'}
            label={config.signatureLabel || 'Tanda Tangan'}
            onChange={(dataUrl) => onAnswerChange(question.id, dataUrl)}
          />
          {currentAnswer && (
            <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-center">
              <p className="text-[10px] text-cyan-400">✅ Tanda tangan tersimpan sebagai PNG ({(currentAnswer.length / 1024).toFixed(1)} KB)</p>
              <button type="button" onClick={() => onAnswerChange(question.id, null)} className="text-[10px] text-rose-400 hover:text-rose-300 mt-1">Hapus tanda tangan</button>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5">
          <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
          <p className="text-xs text-white/20 mt-1">Tipe: {answerType}</p>
        </div>
      )
  }
}
