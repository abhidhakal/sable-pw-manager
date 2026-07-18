import { create } from 'zustand'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 4000) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'border-success/30 bg-success/5',
  error: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-secondary/30 bg-secondary/5',
}

const iconColorMap = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-secondary',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto z-100 flex flex-col gap-2 sm:max-w-sm sm:w-auto">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-3.5 rounded-md
              border bg-surface-elevated shadow-lg
              animate-toast-in cursor-pointer
              ${colorMap[toast.type]}
            `}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} />
            <p className="text-sm text-text-primary leading-snug">{toast.message}</p>
          </div>
        )
      })}
    </div>
  )
}

/** Convenience helper to add toasts from anywhere */
export const toast = {
  success: (msg: string) => useToastStore.getState().addToast('success', msg),
  error: (msg: string) => useToastStore.getState().addToast('error', msg),
  warning: (msg: string) => useToastStore.getState().addToast('warning', msg),
  info: (msg: string) => useToastStore.getState().addToast('info', msg),
}
