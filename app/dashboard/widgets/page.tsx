'use client'

import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { useWidgetsPage } from './use-widgets-page'
import { WidgetsStackingStep } from './widgets-stacking-step'
import { WidgetsAccountingStep } from './widgets-accounting-step'
import { WidgetsVisualizationStep } from './widgets-visualization-step'
import { WidgetsItemAnalysisStep } from './widgets-item-analysis-step'
import { WidgetEditorModal } from './widgets-editor-modal'

export default function WidgetsPage() {
  const w = useWidgetsPage()

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title="CMS Widget Grafik & Rekapitulasi Assessment"
        subtitle="Alur Setup Stacking: Bebas Tambah Perbandingan Pretest/Posttest → Accounting Precision → Publish Dashboard"
      />

      {/* Toast Notification */}
      {w.visible && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {w.message}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* STEP-BY-STEP FLOWING SETUP WIZARD HEADER                                  */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white tracking-wide">CMS Builder & Setup Widget Grafik</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ACCURATE ACCOUNTING ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bebas menambah perbandingan assessment (Stacking) secara bertingkat dan mengkalkulasikan accounting pretest/posttest per-Mitra.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => w.saveWidgetSettings(w.widgets)}
                icon="save"
              >
                Simpan & Sync Dashboard Utama
              </Button>
            </div>
          </div>

          {/* 4 FLOWING STEP BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => w.setSetupStep(1)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                w.setupStep === 1
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${w.setupStep === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 1: Setup Stacking</p>
                <p className="text-[10px] font-mono text-slate-400">Tambah Perbandingan Assessment</p>
              </div>
            </button>

            <button
              onClick={() => w.setSetupStep(2)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                w.setupStep === 2
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${w.setupStep === 2 ? 'bg-purple-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 2: Accounting</p>
                <p className="text-[10px] font-mono text-slate-400">Hasil Rekapitulasi Pre/Post</p>
              </div>
            </button>

            <button
              onClick={() => w.setSetupStep(3)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                w.setupStep === 3
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${w.setupStep === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 3: Analisis Soal</p>
                <p className="text-[10px] font-mono text-slate-400">Item-by-Item Indicator</p>
              </div>
            </button>

            <button
              onClick={() => w.setSetupStep(4)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                w.setupStep === 4
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${w.setupStep === 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                4
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 4: Tampilan & Sync</p>
                <p className="text-[10px] font-mono text-slate-400">Publish Ke Overview</p>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: STACKING ASSESSMENT COMPARISON MANAGEMENT                        */}
        {/* ========================================================================= */}
        {w.setupStep === 1 && (
          <WidgetsStackingStep
            accountingStacks={w.accountingStacks}
            activeStackId={w.activeStackId}
            setActiveStackId={w.setActiveStackId}
            formCodeSearchTerm={w.formCodeSearchTerm}
            setFormCodeSearchTerm={w.setFormCodeSearchTerm}
            isClassificationExpanded={w.isClassificationExpanded}
            setIsClassificationExpanded={w.setIsClassificationExpanded}
            formClassificationBreakdown={w.formClassificationBreakdown}
            responses={w.responses}
            forms={w.forms}
            v15Forms={w.v15Forms}
            users={w.users}
            getFormRespondentCount={w.getFormRespondentCount}
            handleAddAccountingStack={w.handleAddAccountingStack}
            handleRemoveAccountingStack={w.handleRemoveAccountingStack}
            handleUpdateStackItem={w.handleUpdateStackItem}
            onContinue={() => w.setSetupStep(2)}
            show={w.show}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ACCOUNTING PENILAIAN & PERBANDINGAN PRETEST VS POSTTEST PER-MITRA */}
        {/* ========================================================================= */}
        {w.setupStep === 2 && (
          <WidgetsAccountingStep
            accountingStacks={w.accountingStacks}
            activeStackId={w.activeStackId}
            setActiveStackId={w.setActiveStackId}
            activeStackObj={w.activeStackObj}
            activeAccountingResult={w.activeAccountingResult}
            respondentAnswerDistribution={w.respondentAnswerDistribution}
            perStackPartitionBreakdown={w.perStackPartitionBreakdown}
            aspectFormMatrix={w.aspectFormMatrix}
            onContinue={() => w.setSetupStep(3)}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ANALISIS PER-SOAL & PER-INDIKATOR ITEM ANALYSIS (TERPISAH PER FORM)*/}
        {/* ========================================================================= */}
        {w.setupStep === 3 && (
          <WidgetsItemAnalysisStep
            itemQuestionAnalysis={w.itemQuestionAnalysis}
            itemAnalysisFormFilter={w.itemAnalysisFormFilter}
            setItemAnalysisFormFilter={w.setItemAnalysisFormFilter}
            targetForms={w.aspectFormMatrix.targetForms}
            onContinue={() => w.setSetupStep(4)}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PEMILIHAN TAMPILAN, EDITOR WIDGET & SINKRONISASI DASHBOARD UTAMA   */}
        {/* ========================================================================= */}
        {w.setupStep === 4 && (
          <WidgetsVisualizationStep
            widgets={w.widgets}
            filteredWidgets={w.filteredWidgets}
            selectedFormFilter={w.selectedFormFilter}
            setSelectedFormFilter={w.setSelectedFormFilter}
            selectedQuestionFilter={w.selectedQuestionFilter}
            setSelectedQuestionFilter={w.setSelectedQuestionFilter}
            v15Forms={w.v15Forms}
            forms={w.forms}
            responses={w.responses}
            saveWidgetSettings={w.saveWidgetSettings}
            handleToggleWidget={w.handleToggleWidget}
            handleOpenEditor={w.handleOpenEditor}
            handleChangeChartTypeOnCard={w.handleChangeChartTypeOnCard}
            handleChangeColorSchemeOnCard={w.handleChangeColorSchemeOnCard}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL: EDITOR WIDGET CONFIGURATION                                        */}
        {/* ========================================================================= */}
        {w.isEditorOpen && w.editingWidget && (
          <WidgetEditorModal
            config={w.editorConfig}
            onChange={w.setEditorConfig}
            onClose={() => w.setIsEditorOpen(false)}
            onSave={w.handleSaveEditor}
          />
        )}
      </main>
    </div>
  )
}
