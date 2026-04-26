import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  IconLayoutDashboard, IconBuildings, IconCheckbox, IconClock,
  IconFileText, IconUsers, IconArrowRight, IconContract,
  IconPhoto, IconArrowUp, IconArrowDown, IconUsersGroup,
  IconMailDollar, IconArrowsExchange, IconUserCircle,
  IconChartBar, IconRefresh, IconWallet,
  IconSpeakerphone, IconCalendar, IconUmbrella, IconDeviceLaptop,
  IconTarget, IconBrandInstagram, IconFolder, IconBook,
  IconSettings, IconDatabase, IconChevronDown, IconChevronRight, IconBrandWhatsapp,
  IconLogout, IconSearch, IconBell, IconHeartHandshake, IconStar, IconSitemap
} from '@tabler/icons-react'

const NAV_GROUPS = [
  {
    label: 'Layihə İdarəetməsi',
    items: [
      { to: '/', icon: IconLayoutDashboard, label: 'Dashboard', exact: true, adminOnly: true },
      { to: '/layiheler', icon: IconBuildings, label: 'Layihələr' },
      { to: '/tapshiriqlar', icon: IconCheckbox, label: 'Tapşırıqlar' },
      { to: '/is-ucotu', icon: IconClock, label: 'İş Uçotu', adminOnly: true },
      { to: '/icazeler', icon: IconFileText, label: 'İcazə və Razılaşmalar' },
      { to: '/podrat-isleri', icon: IconHeartHandshake, label: 'Podrat İşləri' },
    ]
  },
  {
    label: 'Sifarişçilər',
    adminOnly: true,
    items: [
      { to: '/sifarisci-idareetme', icon: IconUsers, label: 'Sifarişçi İdarəetməsi' },
      { to: '/pipeline', icon: IconArrowRight, label: 'Sifarişçi Pipeline' },
      { to: '/kommersiya-teklifleri', icon: IconFileText, label: 'Kommersiya Təklifləri' },
      { to: '/muqavileler', icon: IconContract, label: 'Müqavilələr' },
      { to: '/portfel', icon: IconPhoto, label: 'Portfel' },
    ]
  },
  {
    label: 'Maliyyə',
    adminOnly: true,
    items: [
      { to: '/daxilolmalar', icon: IconArrowUp, label: 'Daxilolmalar' },
      { to: '/hesab-fakturalar', icon: IconFileText, label: 'Hesab-fakturalar' },
      { to: '/xercler', icon: IconArrowDown, label: 'Xərclər' },
      { to: '/debitor-borclar', icon: IconMailDollar, label: 'Debitor Borclar' },
      { to: '/daxili-kocurmeler', icon: IconArrowsExchange, label: 'Daxili Köçürmələr' },
      { to: '/tesisci-borclari', icon: IconUserCircle, label: 'Təsisçi Borcları' },
      { to: '/hesabatlar', icon: IconChartBar, label: 'Hesabatlar' },
      { to: '/sabit-xercler', icon: IconRefresh, label: 'Sabit Xərclər' },
    ]
  },
  {
    label: 'Komanda',
    items: [
      { to: '/isci-heyeti', icon: IconUsersGroup, label: 'İşçi Heyəti' },
      { to: '/emek-haqqi', icon: IconWallet, label: 'Əmək haqqı' },
      { to: '/performans', icon: IconStar, label: 'Performans' },
      { to: '/karyera-strukturu', icon: IconSitemap, label: 'Karyera Strukturu' },
      { to: '/elanlar', icon: IconSpeakerphone, label: 'Elanlar Lövhəsi' },
      { to: '/hadiseler', icon: IconCalendar, label: 'Hadisələr Təqvimi' },
      { to: '/mezuniyyet', icon: IconUmbrella, label: 'Məzuniyyət Cədvəli' },
      { to: '/avadanliq', icon: IconDeviceLaptop, label: 'Avadanlıq' },
    ]
  },
  {
    label: 'Şirkət',
    items: [
      { to: '/hedef-netice', icon: IconTarget, label: 'Hədəf və Nəticələr' },
      { to: '/mezmun-planlamasi', icon: IconBrandInstagram, label: 'Məzmun Planlaması' },
      { to: '/sened-arxivi', icon: IconFolder, label: 'Sənəd Arxivi' },
      { to: '/qaynaqlar', icon: IconBook, label: 'Qaynaqlar' },
    ]
  },
  {
    label: 'Sistem',
    items: [
      { to: '/parametrler', icon: IconSettings, label: 'Parametrlər' },
      { to: '/sistem-arxivi', icon: IconDatabase, label: 'Sistem Arxivi' },
    ]
  },
]

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        `sidebar-item flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer group ${
          isActive
            ? 'bg-[#0f172a] text-white'
            : 'text-[#555] hover:bg-[#f5f5f0] hover:text-[#0f172a]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon size={14} className={isActive ? 'text-white' : 'text-[#999] group-hover:text-[#0f172a]'} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ group }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-2.5 py-1 text-[9px] font-700 text-[#bbb] uppercase tracking-widest hover:text-[#888] transition-colors"
      >
        {open ? <IconChevronDown size={10} /> : <IconChevronRight size={10} />}
        {group.label}
      </button>
      {open && (
        <div className="space-y-0.5 mt-1">
          {group.items.map(item => <NavItem key={item.to} item={item} />)}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ onSearch, onClose }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/giris')
  }

  return (
    <div className="w-52 min-w-52 h-screen bg-white border-r border-[#e8e8e4] flex flex-col">

      {/* Company header */}
      <div className="p-4 border-b border-[#e8e8e4]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">RA</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-[#0f172a] truncate">Reflect Architects</div>
            <div className="text-[10px] text-[#aaa]">Bakı, Azərbaycan</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-[#aaa] hover:text-[#555] p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-[#e8e8e4]">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-[#f5f5f0] border border-[#e8e8e4] rounded-md text-[11px] text-[#aaa] hover:border-[#d0d0cc] transition-colors"
        >
          <IconSearch size={12} />
          <span className="flex-1 text-left">Axtar...</span>
          <span className="text-[10px] opacity-60">⌘K</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS
          .filter(group => isAdmin || !group.adminOnly)
          .map(group => (
            <NavGroup
              key={group.label}
              group={{
                ...group,
                items: group.items.filter(item => isAdmin || !item.adminOnly)
              }}
            />
          ))
        }
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-[#e8e8e4]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f5f5f0] group cursor-pointer">
          <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-bold">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'RA'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-[#0f172a] truncate">
              {profile?.full_name || 'İstifadəçi'}
            </div>
            <div className="text-[9px] text-[#aaa] truncate">
              {profile?.roles?.title || 'Əməkdaş'}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Çıxış"
          >
            <IconLogout size={14} className="text-[#aaa] hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
