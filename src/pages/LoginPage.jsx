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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: '#F2F3F7',
        backgroundImage: 'radial-gradient(circle, #D1D5E0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="w-full max-w-sm animate-fade-in">

        {/* Card */}
        <div
          className="bg-white px-8 py-10"
          style={{
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #E8E9ED',
          }}
        >
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl tracking-tight"
              style={{ fontWeight: 800, color: '#0F1117', fontFamily: 'Inter, sans-serif' }}
            >
              Reflect
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
              Arxitektorlar üçün əməliyyat sistemi.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wide mb-1.5"
                style={{ color: '#6B7280' }}
              >
                E-poçt
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm transition-all duration-150 outline-none"
                style={{
                  border: '1px solid #E8E9ED',
                  borderRadius: '8px',
                  color: '#0F1117',
                  backgroundColor: '#fff',
                }}
                onFocus={e => e.target.style.borderColor = '#4F6BFB'}
                onBlur={e => e.target.style.borderColor = '#E8E9ED'}
                placeholder="ad@reflect.az"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wide mb-1.5"
                style={{ color: '#6B7280' }}
              >
                Şifrə
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm transition-all duration-150 outline-none"
                style={{
                  border: '1px solid #E8E9ED',
                  borderRadius: '8px',
                  color: '#0F1117',
                  backgroundColor: '#fff',
                }}
                onFocus={e => e.target.style.borderColor = '#4F6BFB'}
                onBlur={e => e.target.style.borderColor = '#E8E9ED'}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2.5"
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  borderRadius: '8px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#4F6BFB',
                borderRadius: '8px',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#3D56E8' }}
              onMouseLeave={e => { e.target.style.backgroundColor = '#4F6BFB' }}
              onMouseDown={e => { e.target.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.target.style.transform = 'scale(1)' }}
            >
              {loading ? 'Daxil olunur...' : 'Daxil ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#D1D5E0' }}>
          Reflect Architects · Bakı, Azərbaycan
        </p>
      </div>
    </div>
  )
}
