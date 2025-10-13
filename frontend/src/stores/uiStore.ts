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

  // Theme
  theme: 'blue' | 'green'

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
  setTheme: (theme: 'blue' | 'green') => void
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
  theme: 'blue',

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
  setTheme: (theme: 'blue' | 'green') => {
    set({ theme })
    // Apply theme to document body
    document.body.classList.remove('theme-blue', 'theme-green')
    document.body.classList.add(`theme-${theme}`)
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'blue' ? 'green' : 'blue'
    get().setTheme(newTheme)
  },
}))

// Initialize theme on load and persist to localStorage
if (typeof window !== 'undefined') {
  // Load theme from localStorage
  const savedTheme = localStorage.getItem('codeforge-theme') as 'blue' | 'green' | null
  
  // Validate and apply saved theme
  if (savedTheme === 'blue' || savedTheme === 'green') {
    useUIStore.getState().setTheme(savedTheme)
    console.log('[UIStore] Loaded theme from localStorage:', savedTheme)
  } else {
    // Default to blue if no valid theme found
    useUIStore.getState().setTheme('blue')
    localStorage.setItem('codeforge-theme', 'blue')
    console.log('[UIStore] Initialized default theme: blue')
  }

  // Subscribe to theme changes and persist to localStorage
  let previousTheme = useUIStore.getState().theme
  useUIStore.subscribe((state) => {
    if (state.theme !== previousTheme) {
      localStorage.setItem('codeforge-theme', state.theme)
      console.log('[UIStore] Theme persisted to localStorage:', state.theme)
      previousTheme = state.theme
    }
  })
}
