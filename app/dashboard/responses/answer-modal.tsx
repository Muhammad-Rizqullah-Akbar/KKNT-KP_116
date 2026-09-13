'use client'

import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { getRespondentAspects, expandScaleLabel, formatAnswerValue } from './helpers'

type AnswerModalProps = {
  respondent: ResponseDoc
  onClose: () => void
  onDelete: (r: ResponseDoc) => void
}

export default function AnswerModal({ respondent, onClose, onDelete }: AnswerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Inspeksi & Analisis Hasil Evaluasi Responden
            </span>
            <h3 className="text-base font-extrabold text-slate-100">
              {respondent.respondent?.name || 'Responden Publik'}
            </h3>
            <p className="text-xs text-slate-400 font-sans font-semibold">
              Formulir: {respondent.formTitle || respondent.formId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans">
          {/* TOP HERO SUMMARY: CODE ANALYSIS & SCORE SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Score & Threshold */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Nilai & Predikat Evaluasi
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  TERVERIFIKASI ✓
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-cyan-300">
                  {respondent.result?.percentage ?? 0}%
                </span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  Grade {respondent.result?.grade || 'N/A'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100">
                {respondent.result?.thresholdTitle || 'Memenuhi Syarat (MS)'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Waktu Selesai: {new Date(respondent.submittedAt || respondent.updatedAt || Date.now()).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Card 2: Code & Author Analysis */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                  Analisis Kode & Author
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold uppercase">
                  {respondent.ownerType || 'cadre'}
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-purple-200 tracking-wider">
                {respondent.distributionCode || 'V1-LEGACY-DIST'}
              </p>
              <div className="text-xs space-y-0.5">
                <p className="text-slate-300 font-bold">
                  Author: <span className="text-purple-300">{respondent.ownerName || 'Administrator BPOM'}</span>
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Form: {respondent.formTitle || 'Formulir Evaluasi Pangan'} (v{respondent.versionNumber || 1.5})
                </p>
              </div>
            </div>
          </div>

          {/* BIODATA RESPONDEN CARD IN INSPECTION MODAL */}
          {((respondent.biodata && respondent.biodata.length > 0) || respondent.respondent?.institution || respondent.respondent?.email || respondent.respondent?.phone) && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Icon name="user" className="w-3.5 h-3.5 text-purple-400" />
                <span>Profil & Data Biodata Diri Responden:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {respondent.respondent?.name && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Nama Lengkap</span>
                    <div className="font-bold text-slate-100">{respondent.respondent.name}</div>
                  </div>
                )}
                {respondent.respondent?.email && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Email</span>
                    <div className="font-bold text-cyan-300">{respondent.respondent.email}</div>
                  </div>
                )}
                {respondent.respondent?.phone && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">No. HP / Telp</span>
                    <div className="font-bold text-emerald-300">{respondent.respondent.phone}</div>
                  </div>
                )}
                {respondent.respondent?.institution && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Instansi / Sekolah</span>
                    <div className="font-bold text-purple-300">{respondent.respondent.institution}</div>
                  </div>
                )}
                {respondent.respondent?.address && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Alamat / Lokasi</span>
                    <div className="font-bold text-slate-200">{respondent.respondent.address}</div>
                  </div>
                )}
                {respondent.biodata?.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate block">{item.label}</span>
                    <div className="font-bold text-cyan-300">{item.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PER-ASPECT BENCHMARK CARD IN INSPECTION MODAL */}
          {(() => {
            const respAspects = getRespondentAspects(respondent)
            if (respAspects.length === 0) return null
            return (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="layers" className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rincian Nilai Per-Aspek (Benchmark Assessment):</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-bold">{respAspects.length} Aspek</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {respAspects.map((asp, aIdx) => (
                    <div key={aIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-200 font-bold truncate max-w-[160px]" title={asp.title}>{asp.title}</span>
                        <span className="text-cyan-300 font-extrabold">{asp.percentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            asp.percentage >= 80 ? 'bg-emerald-500' : asp.percentage >= 60 ? 'bg-cyan-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${asp.percentage}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-slate-400 text-right">
                        {asp.rawScore} / {asp.maxScore} Poin
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* MAIN SECTION: RESPONDENT ANSWERS */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Icon name="fileText" className="w-3.5 h-3.5 text-cyan-400" />
              Rincian Pertanyaan & Jawaban Responden:
            </h4>

            {respondent.result?.questions && respondent.result.questions.length > 0 ? (
              respondent.result.questions.map((q: any, qIdx: number) => {
                const type = q.questionType || q.type
                const prompt = q.prompt || `Pertanyaan ${qIdx + 1}`
                const aspectTitle = q.aspectTitle || (q.aspectId !== 'default' ? q.aspectId : '')

                return (
                  <div key={q.questionId || qIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono font-bold text-cyan-400">
                      <span>Pertanyaan #{String(qIdx + 1).padStart(2, '0')} {aspectTitle ? `• ${aspectTitle}` : ''}</span>
                      {q.maximumScore > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                          {q.percentage}% ({q.rawScore}/{q.maximumScore} Poin)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-100 leading-snug">{prompt}</p>

                    {/* INDICATOR TABLE QUESTION */}
                    {(type === 'indicator-table' || type === 'likert') && q.details?.indicators && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                        <table className="w-full text-xs font-mono">
                          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                            <tr>
                              <th className="text-left p-2.5 px-3.5 border-r border-slate-800 font-sans">Indikator Penilaian</th>
                              <th className="text-right p-2.5 px-3.5 font-sans">Jawaban Responden</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                            {q.details.indicators.map((ind: any, iIdx: number) => (
                              <tr key={iIdx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-2.5 px-3.5 font-sans text-slate-200 border-r border-slate-800">{ind.label || `Indikator ${iIdx + 1}`}</td>
                                <td className="p-2.5 px-3.5 text-right font-bold text-cyan-300">
                                  {expandScaleLabel(ind.selectedValue ?? ind.value ?? '-')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* SINGLE CHOICE / DROPDOWN / BINARY */}
                    {(type === 'single-choice' || type === 'dropdown' || type === 'binary') && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-300 font-bold">
                        {expandScaleLabel(q.selectedValue || q.value || '-')}
                      </div>
                    )}

                    {/* MULTIPLE CHOICE / ARRAY */}
                    {type === 'multiple-choice' && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(Array.isArray(q.selectedValue) ? q.selectedValue : [q.selectedValue]).map((item: any, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold">
                            {expandScaleLabel(item)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* SIGNATURE */}
                    {type === 'signature' && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-white p-2 max-w-xs">
                        <img src={q.selectedValue || respondent.answers?.[q.questionId]} alt="Tanda Tangan" className="max-h-32 mx-auto" />
                      </div>
                    )}

                    {/* TEXT / OTHER */}
                    {!['indicator-table', 'likert', 'single-choice', 'dropdown', 'binary', 'multiple-choice', 'signature'].includes(type) && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200">
                        {String(q.selectedValue || respondent.answers?.[q.questionId] || '-')}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              Object.entries(respondent.answers || {}).map(([key, value], idx) => {
                if (
                  [
                    'respondentName',
                    'respondentEmail',
                    'name',
                    'nama',
                    'email',
                    'createdAt',
                    'formCode',
                    'formId',
                    'formTitle',
                    'submittedAt',
                  ].includes(key)
                )
                  return null

                const { type, content } = formatAnswerValue(value)

                return (
                  <div key={key || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-cyan-400">
                      <span>Pertanyaan #{String(idx + 1).padStart(2, '0')}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-200 leading-snug">{key}</p>

                    {type === 'signature' && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-white p-2 max-w-xs">
                        <img src={content} alt="Tanda Tangan Digital" className="max-h-32 mx-auto" />
                      </div>
                    )}

                    {type === 'table' && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                        <table className="w-full text-xs font-mono">
                          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                            <tr>
                              <th className="text-left p-2.5 px-3.5 border-r border-slate-800 font-sans">Sub Pertanyaan / Indikator</th>
                              <th className="text-right p-2.5 px-3.5 font-sans">Jawaban</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                            {Object.entries(content).map(([subKey, subVal], i) => (
                              <tr key={i}>
                                <td className="p-2.5 px-3.5 font-sans text-slate-300 border-r border-slate-800">{subKey}</td>
                                <td className="p-2.5 px-3.5 text-right font-bold text-cyan-300">
                                  {expandScaleLabel(subVal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {type === 'array' && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {content.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold"
                          >
                            {expandScaleLabel(item)}
                          </span>
                        ))}
                      </div>
                    )}

                    {type === 'text' && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200">
                        {expandScaleLabel(content)}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={() => onDelete(respondent)}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-bold text-rose-300 transition-all flex items-center gap-1.5"
          >
            <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
            <span>Hapus Tanggapan Ini</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
