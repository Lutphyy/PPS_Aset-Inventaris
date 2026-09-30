import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

// Icons as inline SVG for each toast type
const icons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#22c55e" opacity="0.15"/>
      <path d="M6 10.5L8.5 13L14 7.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#ef4444" opacity="0.15"/>
      <path d="M7 7L13 13M13 7L7 13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#f59e0b" opacity="0.15"/>
      <path d="M10 6V11M10 13.5V14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#3b82f6" opacity="0.15"/>
      <path d="M10 9V14M10 6.5V7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

const borderColors = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
}

function Toast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 3500)
    return () => clearTimeout(timerRef.current)
  }, [toast, onRemove])

  const handleClose = () => {
    clearTimeout(timerRef.current)
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ borderLeft: `4px solid ${borderColors[toast.type] || borderColors.info}` }}>
      <div className="toast-icon">{icons[toast.type] || icons.info}</div>
      <div className="toast-body">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose}>×</button>
    </div>
  )
}

function ConfirmDialog({ dialog, onClose }) {
  if (!dialog) return null

  return (
    <div className="confirm-overlay" onClick={() => onClose(false)}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#f59e0b" opacity="0.12"/>
            <path d="M14 8V16M14 19V20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="confirm-title">{dialog.title || 'Konfirmasi'}</h3>
        <p className="confirm-message">{dialog.message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={() => onClose(false)}>
            Batal
          </button>
          <button
            className={`confirm-btn ${dialog.variant === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-ok'}`}
            onClick={() => onClose(true)}
          >
            {dialog.confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)
  const resolveRef = useRef(null)
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type, ...options }])
  }, [])

  const toast = useCallback({}, [])

  // Convenience methods
  const toastAPI = {
    success: (message, opts) => showToast(message, 'success', opts),
    error: (message, opts) => showToast(message, 'error', opts),
    warning: (message, opts) => showToast(message, 'warning', opts),
    info: (message, opts) => showToast(message, 'info', opts),
  }

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setConfirmDialog({ message, ...options })
    })
  }, [])

  const handleConfirmClose = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result)
      resolveRef.current = null
    }
    setConfirmDialog(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, toast: toastAPI, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={handleConfirmClose} />
    </ToastContext.Provider>
  )
}
