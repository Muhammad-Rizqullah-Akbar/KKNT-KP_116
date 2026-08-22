'use client'

import React, { useState } from 'react'
import type { QuestionType, BiodataKey } from '@/lib/forms/v1_5/types'
import type { FormAspect, BuilderQuestion } from '@/lib/forms/v1_5/builderState'
import { QUESTION_TYPES } from '@/lib/forms/v1_5/types'
import { LikertScaleEditor } from './LikertScaleEditor'
import { Icon } from '@/components/ui/Icons'

interface QuestionEditorProps {
  question: BuilderQuestion
  aspects?: FormAspect[]
  onUpdate: (update: Omit<Partial<BuilderQuestion>, 'questionId'>) => void
  onClose: () => void
}

export function QuestionEditor({ question, aspects = [], onUpdate }: QuestionEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'answer'>('content')

  // Helpers for options
  const addOption = () => {
    const newOptId = `${question.questionId}-option-${crypto.randomUUID()}`
    const updatedOptions = [...question.options, { optionId: newOptId, label: `Opsi ${question.options.length + 1}` }]
    onUpdate({ options: updatedOptions })
  }

  const updateOptionLabel = (optionId: string, label: string) => {
    const updatedOptions = question.options.map((opt) =>
      opt.optionId === optionId ? { ...opt, label } : opt
    )
    onUpdate({ options: updatedOptions })
  }

  const removeOption = (optionId: string) => {
    const updatedOptions = question.options.filter((opt) => opt.optionId !== optionId)
    let updatedAnswerKey = question.answerKey
    if (updatedAnswerKey.kind === 'option') {
      updatedAnswerKey = {
        kind: 'option',
        correctOptionIds: updatedAnswerKey.correctOptionIds.filter((id) => id !== optionId),
      }
    }
    onUpdate({ options: updatedOptions, answerKey: updatedAnswerKey })
  }

  const updateOptionScore = (optionId: string, score: number) => {
    const updatedOptions = question.options.map((opt) =>
      opt.optionId === optionId ? { ...opt, score } : opt
    )
    const currentScores = (question.answerKey.kind === 'option' ? question.answerKey.optionScores : {}) || {}
    const updatedOptionScores = { ...currentScores, [optionId]: score }
    const updatedAnswerKey =
      question.answerKey.kind === 'option'
        ? { ...question.answerKey, optionScores: updatedOptionScores }
        : question.answerKey

    onUpdate({ options: updatedOptions, answerKey: updatedAnswerKey })
  }

  const toggleCorrectOption = (optionId: string) => {
    const currentCorrect = question.answerKey.kind === 'option' ? question.answerKey.correctOptionIds : []
    const isSingle = question.type === 'single-choice' || question.type === 'binary' || question.type === 'dropdown'

    let nextCorrect: string[]
    if (isSingle) {
      nextCorrect = currentCorrect.includes(optionId) ? [] : [optionId]
    } else {
      nextCorrect = currentCorrect.includes(optionId)
        ? currentCorrect.filter((id) => id !== optionId)
        : [...currentCorrect, optionId]
    }

    onUpdate({
      answerKey: nextCorrect.length > 0 ? { kind: 'option', correctOptionIds: nextCorrect } : { kind: 'none' },
    })
  }

  const targetAspect = aspects.find((a) => a.aspectId === (question.aspectId || aspects[0]?.aspectId))
  const isScoredAspect = targetAspect?.isScored !== false

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/90 rounded-b-2xl space-y-4 shadow-inner">
      {!isScoredAspect && (
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
      )}

      {/* 2 Focused Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'content'
              ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>KONTEN DAN VALIDASI</span>
        </button>

        {(isScoredAspect || ['single-choice', 'multiple-choice', 'dropdown', 'binary', 'indicator-table', 'likert'].includes(question.type)) && (
          <button
            type="button"
            onClick={() => setActiveTab('answer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'answer'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isScoredAspect ? 'KUNCI JAWABAN, OPSI DAN SKALA' : 'OPSI JAWABAN & PILIHAN'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: KONTEN & VALIDASI */}
      {activeTab === 'content' && (
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Teks Pertanyaan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="Tuliskan teks pertanyaan di sini..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipe Pertanyaan</label>
              <select
                value={question.type}
                onChange={(e) => {
                  const selectedType = e.target.value as QuestionType
                  const biodataMap: Record<string, BiodataKey> = {
                    'biodata-name': 'respondent_name',
                    'biodata-email': 'respondent_email',
                    'biodata-phone': 'respondent_phone',
                    'biodata-address': 'respondent_address',
                    'biodata-institution': 'respondent_institution',
                  }
                  if (biodataMap[selectedType]) {
                    onUpdate({ type: selectedType, biodataKey: biodataMap[selectedType] })
                  } else {
                    onUpdate({ type: selectedType })
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                {!isScoredAspect ? (
                  <>
                    <optgroup label="Tipe Input Umum / Fleksibel">
                      <option value="dropdown">Menu Dropdown</option>
                      <option value="single-choice">Pilihan Ganda Tunggal</option>
                      <option value="multiple-choice">Pilihan Ganda Kompleks</option>
                      <option value="text">Teks Isian Singkat</option>
                      <option value="textarea">Teks Uraian Panjang</option>
                      <option value="number">Angka / Isian Numerik</option>
                      <option value="date">Tanggal</option>
                      <option value="file-upload">Unggah Berkas / Dokumen</option>
                      <option value="signature">Tanda Tangan</option>
                      <option value="binary">Ya / Tidak (Biner)</option>
                    </optgroup>
                    <optgroup label="Field Biodata Terstandardisasi">
                      <option value="biodata-name">Nama Lengkap Responden</option>
                      <option value="biodata-email">Alamat Email / Gmail</option>
                      <option value="biodata-phone">Nomor Telepon / WhatsApp</option>
                      <option value="biodata-address">Lokasi Asal / Alamat</option>
                      <option value="biodata-institution">Organisasi / Instansi Asal</option>
                    </optgroup>
                  </>
                ) : (
                  [
                    { type: 'single-choice', label: 'Pilihan Ganda Tunggal (Single Choice)' },
                    { type: 'multiple-choice', label: 'Pilihan Ganda Kompleks (Multiple Choice)' },
                    { type: 'binary', label: 'Ya / Tidak (Biner)' },
                    { type: 'dropdown', label: 'Menu Dropdown' },
                    { type: 'indicator-table', label: 'Tabel Indikator / Likert Scale' },
                    { type: 'rating', label: 'Skala Rating (1-5 / 1-10)' },
                    { type: 'text', label: 'Teks Isian Singkat' },
                    { type: 'textarea', label: 'Teks Uraian Panjang' },
                    { type: 'file-upload', label: 'Unggah Berkas / Dokumen' },
                    { type: 'date', label: 'Tanggal' },
                    { type: 'number', label: 'Angka / Isian Numerik' },
                  ].map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            {aspects.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Aspek / Bagian</label>
                <select
                  value={question.aspectId || aspects[0]?.aspectId}
                  onChange={(e) => onUpdate({ aspectId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  {aspects.map((asp) => (
                    <option key={asp.aspectId} value={asp.aspectId}>
                      {asp.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teks Placeholder Input</label>
              <input
                type="text"
                value={question.presentation.placeholder || ''}
                onChange={(e) =>
                  onUpdate({ presentation: { ...question.presentation, placeholder: e.target.value } })
                }
                placeholder="Contoh: Pilih salah satu jawaban..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Petunjuk / Deskripsi</label>
              <input
                type="text"
                value={question.presentation.description || ''}
                onChange={(e) =>
                  onUpdate({ presentation: { ...question.presentation, description: e.target.value } })
                }
                placeholder="Petunjuk pengerjaan soal ini..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Validation: Wajib Diisi (Required default true) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 self-end">
              <div>
                <span className="text-xs font-bold text-slate-200">Wajib Diisi (Required)</span>
                <p className="text-[10px] text-slate-400">Responden harus memilih/mengisi sebelum submit</p>
              </div>
              <input
                type="checkbox"
                checked={question.required ?? true}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Lampiran Gambar */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Icon name="image" className="w-4 h-4 text-cyan-400" />
                Lampiran Gambar Pertanyaan
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    presentation: {
                      ...question.presentation,
                      media:
                        question.presentation.media?.type === 'image'
                          ? { type: 'none' }
                          : { type: 'image', url: '', caption: '' },
                    },
                  })
                }
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                {question.presentation.media?.type === 'image' ? 'Hapus Lampiran' : 'Tambah Lampiran'}
              </button>
            </div>

            {question.presentation.media?.type === 'image' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Upload Gambar dari Komputer</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const res = await fetch('/api/v1_5/upload', { method: 'POST', body: formData })
                          const data = await res.json()
                          if (data.success && data.url) {
                            onUpdate({
                              imageUrl: data.url,
                              mediaUrl: data.url,
                              presentation: {
                                ...question.presentation,
                                media: { ...question.presentation.media, type: 'image', url: data.url },
                              },
                            })
                          } else {
                            const reader = new FileReader()
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                const base64 = String(evt.target.result)
                                onUpdate({
                                  imageUrl: base64,
                                  mediaUrl: base64,
                                  presentation: {
                                    ...question.presentation,
                                    media: { ...question.presentation.media, type: 'image', url: base64 },
                                  },
                                })
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        } catch (err) {
                          const reader = new FileReader()
                          reader.onload = (evt) => {
                            if (evt.target?.result) {
                              const base64 = String(evt.target.result)
                              onUpdate({
                                imageUrl: base64,
                                mediaUrl: base64,
                                presentation: {
                                  ...question.presentation,
                                  media: { ...question.presentation.media, type: 'image', url: base64 },
                                },
                              })
                            }
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">URL Gambar (atau Paste Link)</label>
                    <input
                      type="url"
                      value={question.presentation.media.url || ''}
                      onChange={(e) =>
                        onUpdate({
                          presentation: {
                            ...question.presentation,
                            media: { ...question.presentation.media, type: 'image', url: e.target.value },
                          },
                        })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Caption / Keterangan Gambar</label>
                  <input
                    type="text"
                    value={question.presentation.media.caption || ''}
                    onChange={(e) =>
                      onUpdate({
                        presentation: {
                          ...question.presentation,
                          media: { ...question.presentation.media, type: 'image', caption: e.target.value },
                        },
                      })
                    }
                    placeholder="Contoh: Foto fasilitas sanitasi sarana kantin"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {question.presentation.media.url && (
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <img
                      src={question.presentation.media.url}
                      alt={question.presentation.media.caption || 'Preview'}
                      className="w-16 h-16 object-cover rounded-md border border-slate-700 shrink-0"
                    />
                    <span className="text-[11px] text-emerald-400 font-medium">✓ Gambar Terlampir & Siap Ditampilkan</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KUNCI JAWABAN, OPSI & SKALA */}
      {activeTab === 'answer' && (
        <div className="space-y-4 pt-1">
          {/* Option-based types */}
          {['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(question.type) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    {isScoredAspect
                      ? 'Opsi Jawaban & Kunci Benar (Tandai ✓ Pada Jawaban Benar)'
                      : 'Daftar Opsi Jawaban (Tambahkan Pilihan yang Dapat Dipilih Responden)'}
                  </span>
                  {isScoredAspect && question.type === 'multiple-choice' && (
                    <p className="text-[11px] text-cyan-400 mt-0.5 font-medium">
                      💡 Pilihan ganda kompleks: Responden dibatasi hanya memilih sebanyak jumlah opsi kunci yang Anda tentukan (
                      {(question.answerKey.kind === 'option' ? question.answerKey.correctOptionIds.length : 0)} Opsi Kunci Benar).
                    </p>
                  )}
                  {!isScoredAspect && (
                    <p className="text-[11px] text-purple-300 mt-0.5 font-medium">
                      💡 Pilihan opsi ini akan tampil sebagai menu dropdown / opsi pilihan pada biodata responden.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  <span>Tambah Opsi</span>
                </button>
              </div>

              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  const correctOptionIds =
                    question.answerKey.kind === 'option' ? question.answerKey.correctOptionIds : []
                  const isCorrect = isScoredAspect && correctOptionIds.includes(option.optionId)

                  return (
                    <div
                      key={option.optionId}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {isScoredAspect ? (
                        <button
                          type="button"
                          onClick={() => toggleCorrectOption(option.optionId)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold text-xs shrink-0 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-950 text-slate-500 border-slate-700 hover:border-slate-500'
                          }`}
                          title={isCorrect ? 'Opsi Kunci Benar' : 'Tandai Sebagai Jawaban Benar'}
                        >
                          {isCorrect ? '✓' : idx + 1}
                        </button>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          {idx + 1}
                        </span>
                      )}

                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => updateOptionLabel(option.optionId, e.target.value)}
                        placeholder={`Label opsi ${idx + 1}...`}
                        className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                      />

                      {/* Option Score Input for Correct Answers in Scored Aspect */}
                      {isScoredAspect && isCorrect && (
                        <div className="flex items-center gap-1 bg-slate-950 border border-emerald-500/40 rounded-lg px-2 py-1 shrink-0">
                          <span className="text-[10px] text-emerald-400 font-bold">Skor:</span>
                          <input
                            type="number"
                            min={0}
                            value={option.score ?? (question.answerKey.kind === 'option' ? question.answerKey.optionScores?.[option.optionId] : 5) ?? 5}
                            onChange={(e) => updateOptionScore(option.optionId, Math.max(0, Number(e.target.value) || 0))}
                            className="w-12 bg-transparent text-emerald-300 font-bold text-xs text-right focus:outline-none"
                          />
                          <span className="text-[10px] text-emerald-400 font-bold">Poin</span>
                        </div>
                      )}

                      {question.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(option.optionId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus Opsi"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Indicator Table & Likert */}
          {(question.type === 'indicator-table' || question.type === 'likert') && (
            <LikertScaleEditor
              scales={question.presentation.indicatorScales || []}
              indicators={question.presentation.indicators || []}
              showWeightedScore={question.presentation.showWeightedScore}
              onChangeScales={(scales) => onUpdate({ presentation: { ...question.presentation, indicatorScales: scales } })}
              onChangeIndicators={(indicators) => onUpdate({ presentation: { ...question.presentation, indicators } })}
              onChangeShowWeightedScore={(show) => onUpdate({ presentation: { ...question.presentation, showWeightedScore: show } })}
            />
          )}
        </div>
      )}
    </div>
  )
}
