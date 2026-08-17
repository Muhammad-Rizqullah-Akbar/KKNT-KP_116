'use client'

import React, { useState } from 'react'
import type { BuilderState, FormAspect } from '@/lib/forms/v1_5/builderState'
import { addAspect, updateAspect, deleteAspect, reorderAspect, updateMetadata, updateScoring } from '@/lib/forms/v1_5/builderState'
import { builderStateToCanonicalForm } from '@/lib/forms/v1_5/formConverters'
import type { AssessmentOutputMode, CanonicalForm } from '@/lib/forms/v1_5/types'
import { validateCanonicalForm } from '@/lib/forms/v1_5/validation'
import { Icon } from '@/components/ui/Icons'
import { AddAspectModal, ConfirmDeleteModal } from '../modals/FormBuilderModals'

interface Step1SetupProps {
  state: BuilderState
  onChange: (nextState: BuilderState) => void
  onContinue: () => void
}

export function Step1Setup({ state, onChange, onContinue }: Step1SetupProps) {
  const { metadata, aspects, scoring } = state
  const currentOutputMode: AssessmentOutputMode = scoring.outputMode || 'both'

  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [targetOptions, setTargetOptions] = useState<string[]>([])

  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [isCustomTarget, setIsCustomTarget] = useState(false)

  React.useEffect(() => {
    async function fetchRegistry() {
      try {
        const res = await fetch('/api/v1_5/forms/registry')
        const data = await res.json()
        if (data.success) {
          if (Array.isArray(data.categories)) {
            setCategoryOptions(data.categories)
            if (data.categories.length === 0) setIsCustomCategory(true)
          }
          if (Array.isArray(data.targets)) {
            setTargetOptions(data.targets)
            if (data.targets.length === 0) setIsCustomTarget(true)
          }
        }
      } catch (e) {
        setIsCustomCategory(true)
        setIsCustomTarget(true)
      }
    }
    fetchRegistry()
  }, [])

  const currentCat = metadata.category || ''
  const currentTgt = metadata.target || ''

  React.useEffect(() => {
    if (categoryOptions.length > 0 && currentCat && !categoryOptions.includes(currentCat)) {
      setIsCustomCategory(true)
    }
    if (targetOptions.length > 0 && currentTgt && !targetOptions.includes(currentTgt)) {
      setIsCustomTarget(true)
    }
  }, [currentCat, currentTgt, categoryOptions, targetOptions])

  // Update Metadata
  const handleMetadataChange = (field: string, val: string) => {
    onChange(updateMetadata(state, { [field]: val }))
  }

  // Change Result Output Mode
  const handleSelectOutputMode = (mode: AssessmentOutputMode) => {
    onChange(updateScoring(state, { outputMode: mode }))
  }

  // Aspect Operations
  const [isAddAspectModalOpen, setIsAddAspectModalOpen] = useState(false)
  const [deleteAspectIdTarget, setDeleteAspectIdTarget] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddAspectSubmit = (title: string, description: string, isScored: boolean) => {
    const newAspect: FormAspect = {
      aspectId: `aspect_${crypto.randomUUID()}`,
      title,
      description,
      isScored,
    }
    try {
      onChange(addAspect(state, newAspect))
      showToast(`Aspek "${title}" berhasil ditambahkan.`)
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah aspek.')
    }
  }

  const handleUpdateAspectItem = (aspectId: string, update: Partial<FormAspect>) => {
    onChange(updateAspect(state, aspectId, update))
  }

  const executeDeleteAspect = (aspectId: string) => {
    try {
      onChange(deleteAspect(state, aspectId))
      showToast('Aspek berhasil dihapus.')
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus aspek.')
    }
  }

  const handleMoveAspect = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= aspects.length) return
    const aspId = aspects[idx].aspectId
    onChange(reorderAspect(state, aspId, targetIdx))
  }

  const handleUpdateAspectWeight = (aspectId: string, weight: number) => {
    const stageDist = { ...(scoring.stagePointDistribution || {}) }
    stageDist[aspectId] = Math.max(0, Math.min(100, weight))
    onChange(updateScoring(state, { stagePointDistribution: stageDist }))
  }

  const handleAutoDistributeWeights = () => {
    const scoredAspects = aspects.filter((a) => a.isScored !== false)
    if (scoredAspects.length === 0) return

    const autoWeight = Math.floor(100 / scoredAspects.length)
    const stageDist: Record<string, number> = {}
    scoredAspects.forEach((asp, idx) => {
      stageDist[asp.aspectId] =
        idx === scoredAspects.length - 1 ? 100 - autoWeight * (scoredAspects.length - 1) : autoWeight
    })
    onChange(updateScoring(state, { stagePointDistribution: stageDist }))
  }

  const isOverallRequired = currentOutputMode === 'overall' || currentOutputMode === 'both'
  const scoredAspects = aspects.filter((a) => a.isScored !== false)
  const totalWeightSum = scoredAspects.reduce(
    (acc, a) => acc + (scoring.stagePointDistribution?.[a.aspectId] ?? 0),
    0
  )
  const isWeightValid = !isOverallRequired || scoredAspects.length === 0 || Math.round(totalWeightSum) === 100

  const validationIssues = validateCanonicalForm(builderStateToCanonicalForm(state))

  return (
    <div className="space-y-6 py-2">
      {/* Validation Banner Warnings (If any) */}
      {validationIssues.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2 text-amber-300">
            <Icon name="alertTriangle" className="w-4 h-4 shrink-0" />
            <span>Perhatian — Pengaturan Formulir Belum Lengkap:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-amber-300/80">
            {validationIssues.map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 1: FORM METADATA */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Icon name="info" className="w-4 h-4 text-cyan-400" />
            <span>Informasi Dasar Formulir</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Detail judul dan petunjuk bagi responden sebelum mengisi kuesioner.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Judul Penilaian / Kuesioner *</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              placeholder="Contoh: Audit Keamanan Pangan Kantin Sekolah V1.5"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={metadata.description || ''}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
              placeholder="Jelaskan tujuan evaluasi atau pengawasan ini..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
            />
          </div>

          {/* Kategori Evaluasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kategori Evaluasi</label>
            <div className="space-y-2">
              <select
                value={isCustomCategory || categoryOptions.length === 0 ? 'custom' : currentCat || categoryOptions[0]}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomCategory(true)
                  } else {
                    setIsCustomCategory(false)
                    handleMetadataChange('category', e.target.value)
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">
                  {categoryOptions.length === 0 ? 'Belum Ada Kategori Terdaftar — Ketik Baru' : 'Ketik Kategori Baru...'}
                </option>
              </select>

              {(isCustomCategory || categoryOptions.length === 0) && (
                <input
                  type="text"
                  autoFocus
                  value={currentCat}
                  onChange={(e) => handleMetadataChange('category', e.target.value)}
                  placeholder="Tuliskan nama kategori evaluasi baru..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Sasaran Responden */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Sasaran Responden</label>
            <div className="space-y-2">
              <select
                value={isCustomTarget || targetOptions.length === 0 ? 'custom' : currentTgt || targetOptions[0]}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomTarget(true)
                  } else {
                    setIsCustomTarget(false)
                    handleMetadataChange('target', e.target.value)
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                {targetOptions.map((tgt) => (
                  <option key={tgt} value={tgt}>
                    {tgt}
                  </option>
                ))}
                <option value="custom">
                  {targetOptions.length === 0 ? 'Belum Ada Sasaran Terdaftar — Ketik Baru' : 'Ketik Sasaran Responden Baru...'}
                </option>
              </select>

              {(isCustomTarget || targetOptions.length === 0) && (
                <input
                  type="text"
                  autoFocus
                  value={currentTgt}
                  onChange={(e) => handleMetadataChange('target', e.target.value)}
                  placeholder="Tuliskan sasaran responden baru..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RESULT MODE SELECTION */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Icon name="award" className="w-4 h-4 text-purple-400" />
            <span>Mode Penyajian Hasil Assessment (Result Mode)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Pilih bagaimana hasil skor akhir akan disajikan kepada responden dan pengawas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: PER_ASPECT */}
          <button
            type="button"
            onClick={() => handleSelectOutputMode('per_aspect')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              currentOutputMode === 'per_aspect'
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-cyan-400">Mode 01</span>
                {currentOutputMode === 'per_aspect' && <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />}
              </div>
              <h4 className="text-sm font-bold text-slate-100">Per-Aspek (Independent)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap Aspek menghasilkan skor persentase mandiri. Tidak memerlukan penghitungan total nilai akhir.
              </p>
            </div>
          </button>

          {/* Card 2: OVERALL */}
          <button
            type="button"
            onClick={() => handleSelectOutputMode('overall')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              currentOutputMode === 'overall'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-purple-400">Mode 02</span>
                {currentOutputMode === 'overall' && <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />}
              </div>
              <h4 className="text-sm font-bold text-slate-100">Keseluruhan (Overall)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menyajikan satu nilai persentase akumulasi akhir berdasarkan pembobotan aspek.
              </p>
            </div>
          </button>

          {/* Card 3: BOTH */}
          <button
            type="button"
            onClick={() => handleSelectOutputMode('both')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              currentOutputMode === 'both'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-400">Rekomendasi BPOM</span>
                {currentOutputMode === 'both' && <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />}
              </div>
              <h4 className="text-sm font-bold text-slate-100">Per-Aspek & Overall (Both)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menampilkan rincian skor tiap Aspek sekaligus akumulasi nilai akhir keseluruhan.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3: DYNAMIC ASPECT STRUCTURE & WEIGHTS */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Icon name="layers" className="w-4 h-4 text-amber-400" />
              <span>Struktur Dimensi / Aspek Penilaian</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tambahkan kelompok atau dimensi penilaian kuesioner secara dinamis.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddAspectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span>Tambah Aspek</span>
          </button>
        </div>

        {/* Aspect Weight Distribution Status (if Overall or Both) */}
        {isOverallRequired && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-medium">Status Pembobotan Aspek:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  isWeightValid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                Total: {totalWeightSum}% {isWeightValid ? '✓ Valid (100%)' : '⚠ Wajib 100%'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAutoDistributeWeights}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold transition-colors"
            >
              Bagi Rata 100% Otomatis
            </button>
          </div>
        )}

        {/* Aspect Items List */}
        <div className="space-y-3">
          {aspects.map((aspect, idx) => {
            const currentWeight = scoring.stagePointDistribution?.[aspect.aspectId] ?? 0

            return (
              <div
                key={aspect.aspectId}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all"
              >
                {/* Reorder Buttons & Index */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveAspect(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs"
                    >
                      <Icon name="chevronUp" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === aspects.length - 1}
                      onClick={() => handleMoveAspect(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs"
                    >
                      <Icon name="chevronDown" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs font-bold border border-slate-700">
                    {idx + 1}
                  </span>
                </div>

                {/* Aspect Title & Description Inputs */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={aspect.title}
                      onChange={(e) => handleUpdateAspectItem(aspect.aspectId, { title: e.target.value })}
                      placeholder="Nama Aspek Penilaian / Biodata..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />

                    {/* Aspect Scoring Mode Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleUpdateAspectItem(aspect.aspectId, { isScored: aspect.isScored === false ? true : false })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                        aspect.isScored === false
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                      title="Klik untuk mengubah mode penilaian aspek ini"
                    >
                      {aspect.isScored === false ? 'Biodata / Tanpa Skor' : 'Penilaian Berbobot'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={aspect.description || ''}
                    onChange={(e) => handleUpdateAspectItem(aspect.aspectId, { description: e.target.value })}
                    placeholder="Deskripsi ruang lingkup aspek ini..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Weight Input (If Overall or Both and Scored) */}
                {isOverallRequired && aspect.isScored !== false && (
                  <div className="shrink-0 flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-400">Bobot Aspek:</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={currentWeight}
                        onChange={(e) => handleUpdateAspectWeight(aspect.aspectId, Number(e.target.value) || 0)}
                        className="w-full pl-3 pr-7 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500/50 text-right"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-amber-400">%</span>
                    </div>
                  </div>
                )}

                {isOverallRequired && aspect.isScored === false && (
                  <div className="shrink-0 text-[11px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                    0% (Tanpa Penilaian)
                  </div>
                )}

                {/* Delete Aspect */}
                {aspects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeleteAspectIdTarget(aspect.aspectId)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                    title="Hapus Aspek"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Footer Action */}
      <div className="flex items-center justify-end pt-4">
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <span>Lanjutkan ke 02 Build</span>
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL DIALOGS & TOAST NOTIFICATIONS */}
      <AddAspectModal
        isOpen={isAddAspectModalOpen}
        onClose={() => setIsAddAspectModalOpen(false)}
        onSubmit={handleAddAspectSubmit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteAspectIdTarget)}
        title="Hapus Aspek Penilaian"
        message="Apakah Anda yakin ingin menghapus Aspek ini? Pertanyaan di dalamnya akan dipindahkan ke Aspek pertama."
        onClose={() => setDeleteAspectIdTarget(null)}
        onConfirm={() => {
          if (deleteAspectIdTarget) executeDeleteAspect(deleteAspectIdTarget)
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
