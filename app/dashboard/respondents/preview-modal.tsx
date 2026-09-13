'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/ui/Icons'
import { cleanString, findMatchingForm, getScoreColor, getMetricColor } from './helpers'
import type { Respondent } from './types'
import type { FormData } from '@/lib/repositories/forms.repo'

type PreviewModalProps = {
  respondent: Respondent
  forms: FormData[]
  onClose: () => void
}

type AnswerEntry = { key: string; label: string; aspectBadge?: string; value: any; question?: any }

export default function PreviewModal({ respondent, forms, onClose }: PreviewModalProps) {
  const [previewTab, setPreviewTab] = useState<'answers' | 'details'>('answers')

  // ============ FORMAT ANSWER & OPTION RESOLUTION ============
  const questionMetaMap = useMemo(() => {
    const labelMap: Record<string, string> = {}
    const optionMap: Record<string, any[]> = {}
    const aspectMap: Record<string, string> = {}

    forms.forEach(form => {
      form.questions?.forEach((q: any) => {
        const qPrompt = q.question || q.prompt || q.title || q.label || q.id
        const qAspect = (q.aspectTitle || q.category || q.stageName || q.aspectId || q.stageId || '').trim()

        const registerKey = (k: string) => {
          if (!k) return
          labelMap[k] = qPrompt
          if (qAspect) aspectMap[k] = qAspect
          const opts = q.options || q.presentation?.options || q.config?.options || []
          if (Array.isArray(opts) && opts.length > 0) optionMap[k] = opts
        }

        if (q.id) registerKey(q.id)
        if (q.questionId) registerKey(q.questionId)
        const cleanP = cleanString(qPrompt)
        if (cleanP) registerKey(cleanP)

        // Sub-indicators for indicator tables
        const indicators = q.indicators || q.presentation?.indicators || q.config?.indicators || []
        indicators.forEach((ind: any, iIdx: number) => {
          const indId = ind.id || ind.aspectId || `ind_${iIdx}`
          const indLabel = ind.label || ind.title || ind.text || String(ind)
          const subPrompt = `${qPrompt} - ${indLabel}`

          labelMap[`${q.id}-${indId}`] = subPrompt
          labelMap[`${q.id}-${iIdx}`] = subPrompt
          if (q.questionId) {
            labelMap[`${q.questionId}-${indId}`] = subPrompt
            labelMap[`${q.questionId}-${iIdx}`] = subPrompt
          }
          labelMap[indId] = indLabel
        })
      })
    })

    return { labelMap, optionMap, aspectMap }
  }, [forms])

  const questionLabelMap = questionMetaMap.labelMap

  const resolveAnswerDisplayValue = (
    key: string,
    value: any,
    questionObj?: any
  ): { type: 'text' | 'signature' | 'table' | 'array'; content: any } => {
    if (value === null || value === undefined) return { type: 'text', content: '-' }
    if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
      return { type: 'signature', content: value }
    }

    const options =
      (questionObj && (questionObj.options || questionObj.presentation?.options || questionObj.config?.options)) ||
      questionMetaMap.optionMap[key] ||
      questionMetaMap.optionMap[cleanString(key)] ||
      []

    const resolveSingleOpt = (valItem: any) => {
      if (valItem === undefined || valItem === null || valItem === '') return '-'
      const strVal = String(valItem).trim()
      const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')

      if (options && options.length > 0) {
        let matched = options.find((o: any) => {
          if (typeof o === 'string') {
            return o === strVal || (cleanVal && o.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal)
          }
          if (o && typeof o === 'object') {
            const oId = String(o.optionId || o.id || o.value || o.val || '')
            const oLbl = String(o.label || o.text || o.title || '')
            return (
              oId === strVal ||
              oLbl === strVal ||
              (cleanVal &&
                (oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal ||
                  oLbl.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal))
            )
          }
          return false
        })

        if (!matched && !isNaN(Number(strVal))) {
          const numIdx = Number(strVal)
          if (numIdx >= 0 && numIdx < options.length) matched = options[numIdx]
          else if (numIdx >= 1 && numIdx <= options.length) matched = options[numIdx - 1]
        }

        if (!matched && /opt/i.test(strVal)) {
          const trailingDigits = strVal.match(/\d+$/)?.[0]
          if (trailingDigits !== undefined) {
            const extractedIdx = Number(trailingDigits)
            if (extractedIdx >= 0 && extractedIdx < options.length) {
              matched = options[extractedIdx]
            }
          }
        }

        if (matched) {
          return typeof matched === 'object' ? (matched.label || matched.text || matched.title || strVal) : matched
        }
      }

      if (/^(opt_|q_\d+_opt_)/i.test(strVal)) {
        const numMatch = strVal.match(/\d+$/)?.[0]
        if (numMatch !== undefined) {
          const letter = String.fromCharCode(65 + Number(numMatch))
          return `Pilihan ${letter}`
        }
      }

      return strVal
    }

    if (Array.isArray(value)) {
      const resolvedList = value.map((item) => resolveSingleOpt(item))
      return { type: 'array', content: resolvedList }
    }

    if (typeof value === 'object') {
      const resolvedTable: Record<string, any> = {}
      for (const [subKey, subVal] of Object.entries(value)) {
        resolvedTable[subKey] = resolveSingleOpt(subVal)
      }
      return { type: 'table', content: resolvedTable }
    }

    return { type: 'text', content: resolveSingleOpt(value) }
  }

  // ============ SEQUENTIAL PUBLIC FORM ORDER FOR PREVIEW ============
  const getOrderedAnswerEntries = (selectedResp: Respondent): AnswerEntry[] => {
    if (!selectedResp?.answers) return []

    const form = findMatchingForm(selectedResp, forms)

    const answersObj = selectedResp.answers
    const processedKeys = new Set<string>()
    const entries: AnswerEntry[] = []

    if (form && form.questions && Array.isArray(form.questions)) {
      form.questions.forEach((q: any, idx: number) => {
        const qId = q.questionId || q.id
        const qPrompt = q.question || q.prompt || q.title || q.label || `Pertanyaan ${idx + 1}`
        const qAspect = (q.aspectTitle || q.category || q.stageName || q.aspectId || q.stageId || '').trim()

        let foundKey: string | null = null
        let foundValue: any = undefined

        for (const [k, v] of Object.entries(answersObj)) {
          if (processedKeys.has(k)) continue
          if (
            k === qId ||
            k === q.id ||
            k === q.questionId ||
            k === qPrompt ||
            cleanString(k) === cleanString(qPrompt) ||
            k === `q_${idx}` ||
            k === `question_${idx}` ||
            k === `q_${idx + 1}` ||
            k === `question_${idx + 1}`
          ) {
            foundKey = k
            foundValue = v
            break
          }
        }

        if (!foundKey) {
          const cleanP = cleanString(qPrompt)
          for (const [k, v] of Object.entries(answersObj)) {
            if (processedKeys.has(k)) continue
            const cleanK = cleanString(k)
            if (cleanK && cleanP && (cleanK.includes(cleanP) || cleanP.includes(cleanK))) {
              foundKey = k
              foundValue = v
              break
            }
          }
        }

        if (foundKey && foundValue !== undefined) {
          processedKeys.add(foundKey)
          entries.push({
            key: foundKey,
            label: qPrompt,
            aspectBadge: qAspect,
            value: foundValue,
            question: q,
          })
        }
      })
    }

    // Append unmapped entries
    for (const [key, value] of Object.entries(answersObj)) {
      if (processedKeys.has(key)) continue
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
      ) {
        continue
      }

      const label = questionLabelMap[key] || key.replace(/^(q_|question_|sec_\d+_q_)/gi, 'Pertanyaan ').replace(/_/g, ' ')
      const aspectBadge = questionMetaMap.aspectMap[key]
      entries.push({
        key,
        label,
        aspectBadge,
        value,
      })
    }

    return entries
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Preview Jawaban</h3>
            <p className="text-xs text-white/30">
              {respondent.respondentName} • {respondent.formTitle} • {respondent.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
          >
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-2 border-b border-white/6 shrink-0">
          {[
            { id: 'answers', label: 'Jawaban', icon: 'list' },
            { id: 'details', label: 'Detail', icon: 'info' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPreviewTab(tab.id as 'answers' | 'details')}
              className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
                previewTab === tab.id
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              <Icon name={tab.icon as IconName} className="w-3.5 h-3.5 inline mr-1.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {previewTab === 'details' ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Skor', value: `${respondent.score}%`, color: getScoreColor(respondent.score) },
                { label: 'Metrik', value: respondent.metric, color: getMetricColor(respondent.metric) },
                { label: 'Status', value: respondent.status, color: 'text-white' },
                { label: 'Tanggal', value: respondent.date, color: 'text-white/60' },
                { label: 'Formulir', value: respondent.formTitle, color: 'text-white/60' },
                { label: 'Kode', value: respondent.formCode, color: 'text-cyan-400 font-mono' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-white/2 border border-white/5">
                  <p className="text-[10px] text-white/30 uppercase">{item.label}</p>
                  <p className={`text-sm font-medium mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
              {respondent.groupName && (
                <div className="p-3 rounded-xl bg-white/2 border border-white/5 col-span-2">
                  <p className="text-[10px] text-white/30 uppercase">Group</p>
                  <p className="text-sm font-medium text-violet-400 mt-0.5">
                    {respondent.groupName}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {getOrderedAnswerEntries(respondent).map(({ key, label, aspectBadge, value, question }) => {
                const { type, content } = resolveAnswerDisplayValue(key, value, question)

                return (
                  <div key={key} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white/40 font-medium break-words">{label}</p>
                      {aspectBadge && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                          {aspectBadge}
                        </span>
                      )}
                    </div>

                    {type === 'signature' && (
                      <div className="rounded-lg overflow-hidden border border-white/5 bg-white p-2">
                        <img src={content} alt="Tanda Tangan" className="max-h-32 mx-auto" />
                        <p className="text-[10px] text-cyan-400 text-center mt-1">📝 Tanda tangan digital</p>
                      </div>
                    )}

                    {type === 'table' && (
                      <div className="overflow-x-auto rounded-lg border border-white/5">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-white/[0.03]">
                              <th className="text-left py-2 px-3 text-white/40 border-r border-white/5">
                                Sub Pertanyaan
                              </th>
                              <th className="text-left py-2 px-3 text-white/40">Jawaban</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(content).map(
                              ([subKey, subVal]: [string, any], i: number) => (
                                <tr key={i} className="border-t border-white/[0.03]">
                                  <td className="py-2 px-3 text-white/60 border-r border-white/5 break-words">
                                    {questionLabelMap[subKey] || subKey}
                                  </td>
                                  <td className="py-2 px-3 text-cyan-400 font-medium">
                                    {typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {type === 'array' && (
                      <div className="flex flex-wrap gap-1.5">
                        {content.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300"
                          >
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                          </span>
                        ))}
                      </div>
                    )}

                    {type === 'text' && (
                      <p className="text-sm text-cyan-200 font-medium whitespace-pre-wrap break-words">
                        {content}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 shrink-0 gap-3">
          <Link
            href={`/dashboard/responses/${respondent.id}`}
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all flex items-center gap-1.5"
          >
            <Icon name="externalLink" className="w-3.5 h-3.5" />
            <span>Inspeksi Laporan Hasil Penilaian Lengkap</span>
          </Link>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
