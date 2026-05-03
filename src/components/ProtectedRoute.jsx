import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: '#F2F3F7',
          backgroundImage: 'radial-gradient(circle, #D1D5E0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#4F6BFB' }}
          >
            <span className="text-white text-sm font-bold">RA</span>
          </div>
          <div className="text-xs" style={{ color: '#6B7280' }}>Yüklənir...</div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/giris" replace />

  return children
}
