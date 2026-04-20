import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-sm font-bold">RA</span>
          </div>
          <div className="text-xs text-[#aaa]">Yüklənir...</div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/giris" replace />

  return children
}
