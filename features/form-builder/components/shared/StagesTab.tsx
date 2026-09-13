'use client'

import { Icon } from '@/components/ui/Icons'
import { FormStage } from './../shared/ElementTypes'

interface StagesTabProps {
  stages: FormStage[]
  stageMode: 'single' | 'multi'
  elementsLength: number
  draggedStageIndex: number | null
  onStageModeChange: (mode: 'single' | 'multi') => void
  onAddStage: () => void
  onRemoveStage: (stageId: string) => void
  onStageNameChange: (stageId: string, newName: string) => void
  onStageDragStart: (index: number) => void
  onStageDragOver: (e: React.DragEvent, index: number) => void
  onStageDragEnd: () => void
}

export function StagesTab({
  stages,
  stageMode,
  elementsLength,
  draggedStageIndex,
  onStageModeChange,
  onAddStage,
  onRemoveStage,
  onStageNameChange,
  onStageDragStart,
  onStageDragOver,
  onStageDragEnd,
}: StagesTabProps) {
  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Mode Tahapan</h4>
        <div className="flex gap-3">
          <button
            onClick={() => onStageModeChange('single')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              stageMode === 'single'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
            }`}
          >
            <Icon name="layout" className="w-4 h-4 inline mr-2" />
            1 Tahap
          </button>
          <button
            onClick={() => onStageModeChange('multi')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              stageMode === 'multi'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
            }`}
          >
            <Icon name="list" className="w-4 h-4 inline mr-2" />
            Multi Tahap
          </button>
        </div>
      </div>

      {/* Stages List */}
      {stageMode === 'multi' && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Daftar Tahapan</h4>
            <button
              onClick={onAddStage}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all flex items-center gap-1"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Tambah
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => onStageDragStart(index)}
                onDragOver={(e) => onStageDragOver(e, index)}
                onDragEnd={onStageDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all ${
                  draggedStageIndex === index ? 'opacity-50 border-cyan-500/30' : ''
                }`}
              >
                <Icon name="move" className="w-4 h-4 text-white/20 cursor-grab" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onStageNameChange(stage.id, e.target.value)}
                    className="w-full px-2 py-1 rounded bg-transparent text-sm text-white/80 border border-transparent hover:border-white/[0.05] focus:border-cyan-400/40 focus:outline-none transition-all"
                    placeholder={`Tahap ${index + 1}`}
                  />
                  <p className="text-xs text-white/30">
                    {stage.questionIds.length} pertanyaan
                  </p>
                </div>
                <button
                  onClick={() => onRemoveStage(stage.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    stages.length <= 1
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white/30 hover:text-rose-400 hover:bg-rose-500/10'
                  }`}
                  disabled={stages.length <= 1}
                  title={stages.length <= 1 ? 'Minimal 1 tahapan' : 'Hapus tahapan'}
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-white/30 mt-3 flex items-center gap-1">
            <Icon name="info" className="w-3.5 h-3.5" />
            Drag & drop untuk mengubah urutan tahapan
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/60">Total Pertanyaan:</span>
          <span className="text-white font-medium">{elementsLength}</span>
          <span className="text-white/20">•</span>
          <span className="text-white/60">Tahapan:</span>
          <span className="text-white font-medium">{stageMode === 'single' ? 1 : stages.length}</span>
        </div>
      </div>
    </div>
  )
}
