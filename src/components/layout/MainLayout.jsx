import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { IconBell, IconX, IconSearch } from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'

export default function MainLayout() {
  const { profile } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f0]">
      <Sidebar onSearch={() => setSearchOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-11 bg-white border-b border-[#e8e8e4] flex items-center px-5 gap-3 flex-shrink-0">
          <div className="flex-1" />
          <button className="relative text-[#888] hover:text-[#0f172a] transition-colors">
            <IconBell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'RA'}
              </span>
            </div>
            <span className="text-xs text-[#0f172a] font-medium hidden sm:block">
              {profile?.full_name?.split(' ')[0] || 'İstifadəçi'}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Global search modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden fade-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e4]">
              <IconSearch size={16} className="text-[#aaa]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Layihə, tapşırıq, sifarişçi axtar..."
                className="flex-1 text-sm text-[#0f172a] outline-none placeholder-[#bbb]"
              />
              <button onClick={() => setSearchOpen(false)} className="text-[#aaa] hover:text-[#555]">
                <IconX size={16} />
              </button>
            </div>
            <div className="p-4 text-sm text-[#aaa] text-center">
              Axtarış üçün yazmağa başlayın...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
