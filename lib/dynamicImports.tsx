/**
 * Dynamic Import Helpers for Code Splitting
 * 
 * These functions help lazy-load heavy components to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

// ============ FORM BUILDER COMPONENTS ============

/**
 * Lazy load FormBuilderV2 - heaviest component (~1400 lines)
 * Only loads when user actually opens the builder
 */
export const LazyFormBuilderV2 = dynamic(
  () => import('@/components/forms/FormBuilderV2').then(mod => mod.FormBuilderV2),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false, // Builder doesn't need SSR
  }
)

// ============ FORM PREVIEW COMPONENTS ============

/**
 * Lazy load PreviewModal - used only when preview button clicked
 */
export const LazyPreviewModal = dynamic(
  () => import('@/components/form-builder/PreviewModal').then(mod => mod.PreviewModal),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  }
)

// ============ DASHBOARD HEAVY COMPONENTS ============

/**
 * Lazy load SmartUploadArticleModal
 */
export const LazySmartUploadArticleModal = dynamic(
  () => import('@/components/dashboard/articles/SmartUploadArticleModal').then(mod => mod.SmartUploadArticleModal),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  }
)

/**
 * Lazy load MitraProgressModal
 */
export const LazyMitraProgressModal = dynamic(
  () => import('@/components/dashboard/MitraProgressModal').then(mod => mod.MitraProgressModal),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  }
)

// ============ FORM RENDERING COMPONENTS ============

/**
 * Lazy load FormPublicRenderer - only needed on public form pages
 */
export const LazyFormPublicRenderer = dynamic(
  () => import('@/components/forms/FormPublicRenderer').then(mod => mod.FormPublicRenderer),
  {
    ssr: false, // Form interactions are client-side
  }
)

// ============ ICON HELPERS ============

/**
 * Icon map for common icons - reduces bundle by tree-shaking unused icons
 */
export const ICON_MAP = {
  home: 'home',
  file: 'fileText',
  users: 'users',
  chart: 'barChart',
  settings: 'settings',
  search: 'search',
  add: 'plus',
  edit: 'pencil',
  delete: 'trash',
  save: 'save',
  loading: 'loader',
  check: 'check',
  error: 'alertCircle',
  success: 'checkCircle',
  info: 'info',
  warning: 'alertTriangle',
  arrowRight: 'arrowRight',
  arrowLeft: 'arrowLeft',
  menu: 'menu',
  close: 'x',
  filter: 'filter',
  sort: 'sortAsc',
  download: 'download',
  upload: 'upload',
  export: 'fileDown',
  refresh: 'refreshCcw',
} as const

export type IconName = keyof typeof ICON_MAP
