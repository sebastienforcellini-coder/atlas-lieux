import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((msg, dur = 2200) => {
    setToast(msg)
    setTimeout(() => setToast(null), dur)
  }, [])
  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
