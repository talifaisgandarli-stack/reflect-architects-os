// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, variant = 'default' }) {
  const colors = {
    default: '#0F1117',
    success: '#16A34A',
    danger:  '#DC2626',
    warning: '#D97706',
  }
  return (
    <div
      className="bg-white p-4 card-hover"
      style={{ border: '1px solid #E8E9ED', borderRadius: '12px' }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: '#6B7280' }}>
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums" style={{ color: colors[variant] || colors.default }}>
        {value}
      </div>
      {sub && <div className="text-[11px] mt-1" style={{ color: '#6B7280' }}>{sub}</div>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: { backgroundColor: '#F2F3F7', color: '#6B7280' },
    success: { backgroundColor: '#DCFCE7', color: '#16A34A' },
    danger:  { backgroundColor: '#FEE2E2', color: '#DC2626' },
    warning: { backgroundColor: '#FEF3C7', color: '#D97706' },
    info:    { backgroundColor: '#EEF2FF', color: '#4F6BFB' },
    dark:    { backgroundColor: '#0F1117', color: '#FFFFFF' },
  }
  const sizes = {
    sm: { fontSize: '9px',  padding: '2px 6px' },
    md: { fontSize: '11px', padding: '2px 8px' },
    lg: { fontSize: '12px', padding: '4px 10px' },
  }
  return (
    <span
      className="inline-flex items-center font-medium rounded-md"
      style={{ ...variants[variant], ...sizes[size] }}
    >
      {children}
    </span>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold truncate" style={{ color: '#0F1117' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', type = 'button' }) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:   { backgroundColor: '#4F6BFB', color: '#FFFFFF' },
    secondary: { backgroundColor: '#FFFFFF', color: '#0F1117', border: '1px solid #E8E9ED' },
    danger:    { backgroundColor: '#DC2626', color: '#FFFFFF' },
    ghost:     { backgroundColor: 'transparent', color: '#0F1117' },
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]}
    >
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white ${hover ? 'card-hover' : ''} ${className}`}
      style={{ border: '1px solid #E8E9ED', borderRadius: '12px' }}
    >
      {children}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
      {Icon && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#F2F3F7' }}
        >
          <Icon size={26} strokeWidth={1.5} style={{ color: '#D1D5E0' }} />
        </div>
      )}
      <h3 className="text-sm font-semibold mb-1" style={{ color: '#0F1117' }}>{title}</h3>
      {description && (
        <p className="text-xs mb-4 max-w-sm leading-relaxed" style={{ color: '#6B7280' }}>{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />
}

// ── PageLoadingShell ──────────────────────────────────────────────────────────
export function PageLoadingShell({ stats = 4, children }) {
  return (
    <div className="p-4 lg:p-6 space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      {stats > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(stats)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 space-y-2"
              style={{ border: '1px solid #E8E9ED', borderRadius: '12px' }}
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-white overflow-hidden" style={{ border: '1px solid #E8E9ED', borderRadius: '12px' }}>
      <div
        className="px-4 py-3 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, borderBottom: '1px solid #E8E9ED' }}
      >
        {[...Array(cols)].map((_, i) => <Skeleton key={i} className="h-3 w-20" />)}
      </div>
      {[...Array(rows)].map((_, r) => (
        <div
          key={r}
          className="px-4 py-3 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            borderBottom: r < rows - 1 ? '1px solid #F2F3F7' : 'none',
          }}
        >
          {[...Array(cols)].map((_, c) => <Skeleton key={c} className="h-3 w-full" />)}
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 6, cols = 3 }) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 space-y-3"
          style={{ border: '1px solid #E8E9ED', borderRadius: '12px' }}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm fade-in" style={{ borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <div className="p-5">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#0F1117' }}>{title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{message}</p>
        </div>
        <div className="flex gap-2 p-4" style={{ borderTop: '1px solid #E8E9ED' }}>
          <button
            onClick={onCancel}
            className="flex-1 text-sm px-4 py-2 rounded-lg transition-all duration-150"
            style={{ border: '1px solid #E8E9ED', color: '#0F1117', backgroundColor: '#FFFFFF' }}
          >
            Ləğv et
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm px-4 py-2 rounded-lg text-white transition-all duration-150"
            style={{ backgroundColor: danger ? '#DC2626' : '#4F6BFB' }}
          >
            {danger ? 'Sil' : 'Təsdiqlə'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const maxWidths = { sm: '384px', md: '512px', lg: '672px', xl: '896px' }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full fade-in my-2 sm:my-8"
        style={{ maxWidth: maxWidths[size], borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 sticky top-0 bg-white rounded-t-2xl z-10"
          style={{ borderBottom: '1px solid #E8E9ED' }}
        >
          <h3 className="text-sm font-semibold truncate pr-2" style={{ color: '#0F1117' }}>{title}</h3>
          <button
            onClick={onClose}
            className="text-lg leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ color: '#6B7280' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F2F3F7'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
