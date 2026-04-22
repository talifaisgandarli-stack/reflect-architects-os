import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { IconBell, IconX, IconSearch, IconMenu2 } from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'

export default function MainLayout() {
  const { profile } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSidebarOpen(false) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f0]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide in */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onSearch={() => { setSearchOpen(true); setSidebarOpen(false) }} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="h-11 bg-white border-b border-[#e8e8e4] flex items-center px-3 lg:px-5 gap-3 flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#888] hover:text-[#0f172a] transition-colors p-1"
          >
            <IconMenu2 size={18} />
          </button>

          <div className="flex-1" />

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-[#888] hover:text-[#0f172a] transition-colors hidden sm:block"
          >
            <IconSearch size={16} />
          </button>

          <button className="relative text-[#888] hover:text-[#0f172a] transition-colors">
            <IconBell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
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
