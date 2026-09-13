'use client'

interface ToastNotificationProps {
  visible: boolean
  message: string
}

export default function ToastNotification({ visible, message }: ToastNotificationProps) {
  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
      {message}
    </div>
  )
}
