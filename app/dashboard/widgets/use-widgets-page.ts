'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import {
  fetchWidgetData,
  type WidgetItem,
  type StackedAccountingItem,
  type WidgetCmsData,
  type WidgetEditorConfig,
} from './widgets-utils'
import { useWidgetsDerivations } from './use-widgets-derivations'

export function useWidgetsPage() {
  const { userData, userRole, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [authLoading, userRole, userData, router])

  // Active Setup Step Flow: 1 -> 2 -> 3 -> 4
  const [setupStep, setSetupStep] = useState<number>(1)

  // STACKABLE ACCOUNTING COMPARISONS LIST (Multiple Comparisons can be added!)
  const [accountingStacks, setAccountingStacks] = useState<StackedAccountingItem[]>([
    {
      id: 'stack-1',
      title: 'Perbandingan Assessment Keamanan Pangan #1',
      mode: 'single',
      pretestFormId: 'all',
      posttestFormId: 'all',
      enabled: true,
    },
  ])

  // Active Selected Stack Index for Detailed Viewing
  const [activeStackId, setActiveStackId] = useState<string>('stack-1')

  // Data States Fetched Dynamically From Database (via useQuery below)
  const [widgets, setWidgets] = useState<WidgetItem[]>([])

  // Search & Chart Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [formCodeSearchTerm, setFormCodeSearchTerm] = useState('')
  const [isClassificationExpanded, setIsClassificationExpanded] = useState(false)
  const [chartTypeFilter, setChartTypeFilter] = useState<string>('all')
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all')
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all')

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null)
  const [editorConfig, setEditorConfig] = useState<WidgetEditorConfig>({
    title: '',
    chartType: 'bar',
    colorScheme: 'cyan',
    showLegend: true,
  })

  // Toast Notification
  const { visible, message, show } = useToast()

  // Load All Forms, Responses, & Users Dynamically From Database via useQuery
  const {
    data: {
      responses = [],
      forms = [],
      v15Forms = [],
      users = [],
      dynamicWidgets = [],
    } = {},
  } = useQuery<WidgetCmsData>({
    queryKey: queryKeys.widgets.cmsData,
    queryFn: fetchWidgetData,
    staleTime: 5 * 60 * 1000, // 5 menit: cache data, hindari refetch berulang (cost optimization)
    gcTime: 30 * 60 * 1000, // 30 menit garbage collection
  })

  // Hydrate widget/stacks from localStorage (or fall back to dynamically-generated widgets)
  useEffect(() => {
    if (dynamicWidgets.length === 0) return

    if (typeof window !== 'undefined') {
      const savedWidgets = localStorage.getItem('dashboard_widgets_cms_config_v5')
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets)
          if (Array.isArray(parsed) && parsed.length > 0) setWidgets(parsed)
          else setWidgets(dynamicWidgets)
        } catch {
          setWidgets(dynamicWidgets)
        }
      } else {
        setWidgets(dynamicWidgets)
      }

      const savedStacks = localStorage.getItem('dashboard_accounting_stack_v5')
      if (savedStacks) {
        try {
          const parsed = JSON.parse(savedStacks)
          if (Array.isArray(parsed) && parsed.length > 0) setAccountingStacks(parsed)
        } catch {}
      }
    } else {
      setWidgets(dynamicWidgets)
    }
  }, [dynamicWidgets])

  // Save Settings Local & Sync to Main Dashboard
  const saveWidgetSettings = (updatedList: WidgetItem[], updatedStacks: StackedAccountingItem[] = accountingStacks) => {
    setWidgets(updatedList)
    setAccountingStacks(updatedStacks)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widgets_cms_config_v5', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_widgets_config', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_accounting_stack_v5', JSON.stringify(updatedStacks))
    }
    show('Pengaturan accounting & widget grafik berhasil disimpan ke Dashboard Utama!')
  }

  // Add A New Stackable Comparison Card
  const handleAddAccountingStack = () => {
    const newId = `stack-${Date.now()}`
    const newStack: StackedAccountingItem = {
      id: newId,
      title: `Perbandingan Assessment Keamanan Pangan #${accountingStacks.length + 1}`,
      mode: 'single',
      pretestFormId: 'all',
      posttestFormId: 'all',
      enabled: true,
    }
    const nextStacks = [...accountingStacks, newStack]
    setActiveStackId(newId)
    saveWidgetSettings(widgets, nextStacks)
  }

  // Remove A Stackable Comparison Card
  const handleRemoveAccountingStack = (stackId: string) => {
    if (accountingStacks.length <= 1) {
      show('Minimal 1 perbandingan assessment harus tersedia.')
      return
    }
    const nextStacks = accountingStacks.filter((s) => s.id !== stackId)
    setActiveStackId(nextStacks[0].id)
    saveWidgetSettings(widgets, nextStacks)
  }

  // Update An Accounting Stack Item
  const handleUpdateStackItem = (stackId: string, updates: Partial<StackedAccountingItem>) => {
    const nextStacks = accountingStacks.map((s) => (s.id === stackId ? { ...s, ...updates } : s))
    saveWidgetSettings(widgets, nextStacks)
  }

  // Quick Change Chart Type directly on card
  const handleChangeChartTypeOnCard = (id: string, newType: 'bar' | 'pie' | 'line' | 'number' | 'matrix') => {
    const nextList = widgets.map((w) => (w.id === id ? { ...w, chartType: newType } : w))
    saveWidgetSettings(nextList)
  }

  // Quick Change Color Scheme directly on card
  const handleChangeColorSchemeOnCard = (id: string, schemeId: string) => {
    const nextList = widgets.map((w) =>
      w.id === id ? { ...w, config: { ...w.config, colorScheme: schemeId } } : w
    )
    saveWidgetSettings(nextList)
  }

  // Toggle Widget State (Publish to Main Dashboard)
  const handleToggleWidget = (id: string) => {
    const nextList = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    saveWidgetSettings(nextList)
  }

  // Open Editor Modal
  const handleOpenEditor = (w: WidgetItem) => {
    setEditingWidget(w)
    setEditorConfig({
      title: w.config?.title || w.questionText,
      chartType: w.chartType,
      colorScheme: w.config?.colorScheme || 'cyan',
      showLegend: w.config?.showLegend !== false,
    })
    setIsEditorOpen(true)
  }

  // Save Editor Changes
  const handleSaveEditor = () => {
    if (!editingWidget) return
    const updatedList = widgets.map((w) => {
      if (w.id === editingWidget.id) {
        return {
          ...w,
          chartType: editorConfig.chartType,
          config: {
            ...w.config,
            title: editorConfig.title,
            colorScheme: editorConfig.colorScheme,
            showLegend: editorConfig.showLegend,
          },
        }
      }
      return w
    })
    saveWidgetSettings(updatedList)
    setIsEditorOpen(false)
    setEditingWidget(null)
  }

  // State for Step 3 Item Analysis Form Filter Tab
  const [itemAnalysisFormFilter, setItemAnalysisFormFilter] = useState<string>('all')

  // Active Selected Accounting Computation
  const activeStackObj = accountingStacks.find((s) => s.id === activeStackId) || accountingStacks[0]

  const derivations = useWidgetsDerivations({
    accountingStacks,
    activeStackId,
    formCodeSearchTerm,
    responses,
    forms,
    v15Forms,
    users,
    widgets,
    activeStackObj,
    itemAnalysisFormFilter,
    selectedFormFilter,
    selectedQuestionFilter,
    searchTerm,
    chartTypeFilter,
  })

  return {
    setupStep,
    setSetupStep,
    accountingStacks,
    activeStackId,
    setActiveStackId,
    widgets,
    searchTerm,
    setSearchTerm,
    formCodeSearchTerm,
    setFormCodeSearchTerm,
    isClassificationExpanded,
    setIsClassificationExpanded,
    chartTypeFilter,
    setChartTypeFilter,
    selectedFormFilter,
    setSelectedFormFilter,
    selectedQuestionFilter,
    setSelectedQuestionFilter,
    isEditorOpen,
    setIsEditorOpen,
    editingWidget,
    editorConfig,
    setEditorConfig,
    visible,
    message,
    show,
    responses,
    forms,
    v15Forms,
    users,
    saveWidgetSettings,
    handleAddAccountingStack,
    handleRemoveAccountingStack,
    handleUpdateStackItem,
    handleChangeChartTypeOnCard,
    handleChangeColorSchemeOnCard,
    handleToggleWidget,
    handleOpenEditor,
    handleSaveEditor,
    activeStackObj,
    itemAnalysisFormFilter,
    setItemAnalysisFormFilter,
    ...derivations,
  }
}

export type WidgetsPageController = ReturnType<typeof useWidgetsPage>
