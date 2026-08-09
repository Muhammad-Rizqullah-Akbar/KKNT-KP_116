'use client'

import React from 'react'
import type { FormValidationIssue } from '@/lib/forms/v1_5/validation'
import { Icon } from '@/components/ui/Icons'

interface ValidationErrorsBannerProps {
  issues: FormValidationIssue[]
  onDismiss?: () => void
}

export function ValidationErrorsBanner({ issues, onDismiss }: ValidationErrorsBannerProps) {
  if (issues.length === 0) return null

  return (
    <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-200 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon name="alertCircle" className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">
              Terdapat {issues.length} masalah validasi formulir:
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-rose-300/90 list-disc list-inside">
              {issues.map((issue, idx) => (
                <li key={`${issue.path}-${idx}`}>
                  <span className="font-mono text-rose-400 text-[11px] mr-1">[{issue.path}]</span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
