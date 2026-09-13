import { create } from 'zustand'

/**
 * Zustand store — client-side UI state (bukan server state).
 * Hanya untuk state UI lokal: modal, sidebar, filter sementara.
 * Data server dikelola TanStack Query, BUKAN di sini.
 */

interface UIState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
