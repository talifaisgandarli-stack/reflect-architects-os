import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  IconLayoutDashboard, IconBuildings, IconCheckbox,
  IconArchive, IconHeartHandshake, IconUsers,
  IconCash, IconUsersGroup, IconWallet,
  IconStar, IconUmbrella, IconCalendar,
  IconSpeakerphone, IconDeviceLaptop,
  IconTarget, IconSitemap, IconBrandInstagram,
  IconSettings, IconLogout, IconHome,
} from '@tabler/icons-react'

// ── NAV DEFİNİTİON (final spec 2026-05-03) ──────────────────────────────────

const ADMIN_GROUPS = [
  {
    label: 'İŞ',
    items: [
      { to: '/', icon: IconLayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/layiheler', icon: IconBuildings, label: 'Layihələr' },
      { to: '/tapshiriqlar', icon: IconCheckbox, label: 'Tapşırıqlar' },
      { to: '/arxiv', icon: IconArchive, label: 'Arxiv' },
      { to: '/podrat-isleri', icon: IconHeartHandshake, label: 'Podrat İşləri' },
    ],
  },
  {
    label: 'MÜŞTƏRİLƏR',
    items: [
      { to: '/musteriler', icon: IconUsers, label: 'Müştərilər' },
    ],
  },
  {
    label: 'MALİYYƏ MƏRKƏZİ',
    items: [
      { to: '/maliyye-merkezi', icon: IconCash, label: 'Maliyyə Mərkəzi' },
    ],
  },
  {
    label: 'KOMANDA',
    items: [
      { to: '/isci-heyeti', icon: IconUsersGroup, label: 'İşçi Heyəti' },
      { to: '/emek-haqqi', icon: IconWallet, label: 'Əmək Haqqı' },
      { to: '/performans', icon: IconStar, label: 'Performans' },
      { to: '/mezuniyyet', icon: IconUmbrella, label: 'Məzuniyyət' },
      { to: '/hadiseler', icon: IconCalendar, label: 'Təqvim' },
      { to: '/elanlar', icon: IconSpeakerphone, label: 'Elanlar' },
      { to: '/avadanliq', icon: IconDeviceLaptop, label: 'Avadanlıq' },
    ],
  },
  {
    label: 'ŞİRKƏT',
    items: [
      { to: '/hedef-netice', icon: IconTarget, label: 'OKR' },
      { to: '/karyera-strukturu', icon: IconSitemap, label: 'Karyera Strukturu' },
      { to: '/mezmun-planlamasi', icon: IconBrandInstagram, label: 'Məzmun Planlaması' },
    ],
  },
  {
    label: 'SİSTEM',
    items: [
      { to: '/parametrler', icon: IconSettings, label: 'Parametrlər' },
    ],
  },
]

const USER_GROUPS = [
  {
    label: 'İŞ',
    items: [
      { to: '/employee-dashboard', icon: IconHome, label: 'Dashboard', exact: true },
      { to: '/layiheler', icon: IconBuildings, label: 'Layihələr' },
      { to: '/tapshiriqlar', icon: IconCheckbox, label: 'Tapşırıqlar' },
      { to: '/arxiv', icon: IconArchive, label: 'Arxiv' },
      { to: '/podrat-isleri', icon: IconHeartHandshake, label: 'Podrat İşləri' },
    ],
  },
  {
    label: 'KOMANDA',
    items: [
      { to: '/isci-heyeti', icon: IconUsersGroup, label: 'İşçi Heyəti' },
      { to: '/emek-haqqi', icon: IconWallet, label: 'Əmək Haqqı' },
      { to: '/performans', icon: IconStar, label: 'Performans' },
      { to: '/mezuniyyet', icon: IconUmbrella, label: 'Məzuniyyət' },
      { to: '/hadiseler', icon: IconCalendar, label: 'Təqvim' },
      { to: '/elanlar', icon: IconSpeakerphone, label: 'Elanlar' },
      { to: '/avadanliq', icon: IconDeviceLaptop, label: 'Avadanlıq' },
    ],
  },
  {
    label: 'ŞİRKƏT',
    items: [
      { to: '/hedef-netice', icon: IconTarget, label: 'OKR' },
      { to: '/karyera-strukturu', icon: IconSitemap, label: 'Karyera Strukturu' },
    ],
  },
]

// ── COMPONENTS ───────────────────────────────────────────────────────────────

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-all duration-150 cursor-pointer group ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-[#8B8FA8] hover:text-white hover:bg-white/6'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={15}
            className="flex-shrink-0 transition-colors duration-150"
            style={{ color: isActive ? '#FFFFFF' : '#8B8FA8' }}
          />
          <span className="flex-1 truncate font-[400]">{item.label}</span>
          {item.badge && (
            <span
              className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#DC2626' }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavGroup({ group }) {
  return (
    <div className="mb-4">
      <div
        className="px-3 py-1 text-[10px] font-[500] tracking-widest uppercase mb-1"
        style={{ color: '#4B5060' }}
      >
        {group.label}
      </div>
      <div className="space-y-0.5">
        {group.items.map(item => <NavItem key={item.to} item={item} />)}
      </div>
    </div>
  )
}

// ── MAIN SIDEBAR ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { profile, signOut, isAdmin } = useAuth()

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'

  const groups = isAdmin ? ADMIN_GROUPS : USER_GROUPS

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{ backgroundColor: '#1A1D23', width: '220px' }}
    >
      {/* Logo */}
      <div
        className="px-4 py-5 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#4F6BFB' }}
        >
          <span className="text-white text-[9px] font-black tracking-wider">RA</span>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-white leading-tight">Reflect</div>
          <div className="text-[10px] leading-tight" style={{ color: '#4B5060' }}>Architects OS</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {groups.map(group => (
          <NavGroup key={group.label} group={group} />
        ))}
      </div>

      {/* User footer */}
      <div
        className="px-2 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer group hover:bg-white/6 transition-colors duration-150">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#4F6BFB' }}
          >
            <span className="text-white text-[10px] font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white truncate">
              {profile?.full_name || 'İstifadəçi'}
            </div>
            <div className="text-[10px] truncate" style={{ color: '#4B5060' }}>
              {isAdmin ? 'Admin' : 'İşçi'}
            </div>
          </div>
          <button
            onClick={signOut}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-150"
            style={{ color: '#8B8FA8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
            onMouseLeave={e => e.currentTarget.style.color = '#8B8FA8'}
            title="Çıxış"
          >
            <IconLogout size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
