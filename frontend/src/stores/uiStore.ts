import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

export interface Modal {
  id: string
  title: string
  content: React.ReactNode
  onClose?: () => void
}

interface UIState {
  // Loading states
  isLoading: boolean
  loadingMessage: string

  // Error state
  error: string | null

  // Toast notifications
  toasts: Toast[]

  // Modals
  modals: Modal[]

  // Sidebar state
  sidebarOpen: boolean

  // Theme (for amber mode toggle)
  theme: 'green' | 'amber'

  // Actions
  setLoading: (isLoading: boolean, message?: string) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Toast actions
  showToast: (type: ToastType, message: string, duration?: number) => string
  removeToast: (id: string) => void
  clearToasts: () => void

  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void

  // Sidebar actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Theme actions
  setTheme: (theme: 'green' | 'amber') => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  isLoading: false,
  loadingMessage: '',
  error: null,
  toasts: [],
  modals: [],
  sidebarOpen: true,
  theme: 'green',

  // Loading
  setLoading: (isLoading: boolean, message: string = '') => {
    set({ isLoading, loadingMessage: message })
  },

  // Error
  setError: (error: string | null) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  },

  // Toast actions
  showToast: (type: ToastType, message: string, duration: number = 5000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const toast: Toast = {
      id,
      type,
      message,
      duration,
    }

    set((state) => ({
      toasts: [...state.toasts, toast],
    }))

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }

    return id
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },

  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => {
    const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newModal: Modal = {
      ...modal,
      id,
    }

    set((state) => ({
      modals: [...state.modals, newModal],
    }))

    return id
  },

  closeModal: (id: string) => {
    const modal = get().modals.find((m) => m.id === id)
    if (modal?.onClose) {
      modal.onClose()
    }

    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }))
  },

  closeAllModals: () => {
    const { modals } = get()
    modals.forEach((modal) => {
      if (modal.onClose) {
        modal.onClose()
      }
    })

    set({ modals: [] })
  },

  // Sidebar
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open })
  },

  // Theme
  setTheme: (theme: 'green' | 'amber') => {
    set({ theme })
    // Apply theme to document body
    document.body.classList.remove('theme-green', 'theme-amber')
    document.body.classList.add(`theme-${theme}`)
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'green' ? 'amber' : 'green'
    get().setTheme(newTheme)
  },
}))

// Initialize theme on load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('codeforge-theme') as 'green' | 'amber' | null
  if (savedTheme) {
    useUIStore.getState().setTheme(savedTheme)
  }

  // Save theme changes to localStorage
  useUIStore.subscribe(
    (state) => state.theme,
    (theme) => {
      localStorage.setItem('codeforge-theme', theme)
    }
  )
}
