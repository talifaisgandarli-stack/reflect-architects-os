import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext({})

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
}

const STYLES = {
  success: 'bg-white border-l-4 border-l-green-500 text-[#0f172a]',
  error:   'bg-white border-l-4 border-l-red-500 text-[#0f172a]',
  warning: 'bg-white border-l-4 border-l-amber-500 text-[#0f172a]',
  info:    'bg-white border-l-4 border-l-blue-500 text-[#0f172a]',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const recentKeys = useRef(new Set())

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const key = `${type}:${message}`
    if (recentKeys.current.has(key)) return
    recentKeys.current.add(key)
    setTimeout(() => recentKeys.current.delete(key), 1000)

    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            onClick={() => removeToast(toast.id)}
            className={`toast-enter pointer-events-auto flex items-start gap-3 pl-3 pr-2 py-2.5 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.08)] text-xs font-medium w-full sm:min-w-[280px] sm:max-w-sm cursor-pointer hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-shadow ${STYLES[toast.type] || STYLES.info}`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${ICON_COLORS[toast.type] || ICON_COLORS.info}`}>
              {ICONS[toast.type] || ICONS.info}
            </div>
            <span className="flex-1 leading-snug pr-1 break-words">{toast.message}</span>
            <button
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[#bbb] hover:text-[#555] transition-colors text-sm leading-none -mt-0.5"
              aria-label="Bağla"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
