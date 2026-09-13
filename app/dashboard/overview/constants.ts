// ============ KONSTANTA & HELPER MURNI (dibagi antar sub-komponen overview) ============

export const colorSchemes: Record<string, string[]> = {
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
}

export const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
