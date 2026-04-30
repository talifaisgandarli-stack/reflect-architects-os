// Stat/KPI card
export function StatCard({ label, value, sub, variant = 'default' }) {
  const colors = {
    default: 'text-[#0f172a]',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
  }
  return (
    <div className="bg-white border border-[#e8e8e4] rounded-lg p-4">
      <div className="text-[10px] font-600 text-[#aaa] uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`text-xl font-bold ${colors[variant]}`}>{value}</div>
      {sub && <div className="text-[11px] text-[#aaa] mt-1">{sub}</div>}
    </div>
  )
}

// Status badge
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    dark: 'bg-[#0f172a] text-white',
  }
  const sizes = { sm: 'text-[9px] px-1.5 py-0.5', md: 'text-[10px] px-2 py-0.5', lg: 'text-xs px-2.5 py-1' }
  return (
    <span className={`inline-flex items-center font-medium rounded-md ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

// Page header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-[#0f172a] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#888] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// Button
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '' }) {
  const variants = {
    primary: 'bg-[#0f172a] text-white hover:bg-[#1e293b]',
    secondary: 'bg-white text-[#0f172a] border border-[#e8e8e4] hover:bg-[#f5f5f0]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-[#0f172a] hover:bg-[#f5f5f0]',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-sm px-5 py-2.5' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Card wrapper
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#e8e8e4] rounded-lg ${className}`}>
      {children}
    </div>
  )
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} className="text-[#ddd] mb-3" />}
      <h3 className="text-sm font-medium text-[#555] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#aaa] mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// Skeleton loader
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />
}

// Confirm dialog
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm fade-in">
        <div className="p-5">
          <h3 className="text-sm font-bold text-[#0f172a] mb-2">{title}</h3>
          <p className="text-xs text-[#666] leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 p-4 border-t border-[#f0f0ec]">
          <button onClick={onCancel} className="flex-1 text-sm px-4 py-2 border border-[#e8e8e4] rounded-lg hover:bg-[#f5f5f0] transition-colors">
            Ləğv et
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-sm px-4 py-2 rounded-lg text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0f172a] hover:bg-[#1e293b]'}`}
          >
            {danger ? 'Sil' : 'Təsdiqlə'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal wrapper
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizes[size]} fade-in my-2 sm:my-auto`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[#e8e8e4] sticky top-0 bg-white rounded-t-xl z-10">
          <h3 className="text-sm font-bold text-[#0f172a] truncate pr-2">{title}</h3>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#555] transition-colors text-lg leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center -mr-2">✕</button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
