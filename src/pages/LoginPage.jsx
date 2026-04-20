import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('E-poçt və şifrə daxil edin'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) {
      setError('E-poçt və ya şifrə yanlışdır. Yenidən cəhd edin.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0f172a] rounded-xl mb-4">
            <span className="text-white text-xl font-bold">RA</span>
          </div>
          <h1 className="text-xl font-bold text-[#0f172a]">Reflect Architects</h1>
          <p className="text-sm text-[#888] mt-1">İdarəetmə sisteminə daxil olun</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#e8e8e4] rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-600 text-[#444] uppercase tracking-wide mb-1.5">
                E-poçt
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] transition-colors"
                placeholder="ad@reflect.az"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-[#444] uppercase tracking-wide mb-1.5">
                Şifrə
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e293b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Daxil olunur...' : 'Daxil ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#aaa] mt-6">
          Reflect Architects · Bakı, Azərbaycan
        </p>
      </div>
    </div>
  )
}
