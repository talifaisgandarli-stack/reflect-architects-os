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
  IconSettings, IconDatabase, IconChevronDown, IconChevronRight,
  IconLogout, IconSearch, IconBell, IconHeartHandshake, IconStar, IconSitemap,
  IconHome
} from '@tabler/icons-react'

const NAV_GROUPS = [
  {
    label: 'Layihə İdarəetməsi',
    items: [
      { to: '/', icon: IconLayoutDashboard, label: 'Admin Dashboard', exact: true, adminOnly: true },
      { to: '/employee-dashboard', icon: IconHome, label: 'Dashboard', exact: true, employeeOnly: true },
      { to: '/layiheler', icon: IconBuildings, label: 'Layihələr' },
      { to: '/tapshiriqlar', icon: IconCheckbox, label: 'Tapşırıqlar' },
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
      { to: '/karyera-strukturu', icon: IconSitemap, label: 'Karyera Strukturu', adminOnly: true },
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
      { to: '/mezmun-planlamasi', icon: IconBrandInstagram, label: 'Məzmun Planlaması', adminOnly: true },
      { to: '/sened-arxivi', icon: IconFolder, label: 'Sənəd Arxivi' },
      { to: '/qaynaqlar', icon: IconBook, label: 'Qaynaqlar' },
    ]
  },
  {
    label: 'Sistem',
    adminOnly: true,
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
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuth()

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'

  const filteredGroups = NAV_GROUPS
    .filter(group => isAdmin || !group.adminOnly)
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.adminOnly && !isAdmin) return false
        if (item.employeeOnly && isAdmin) return false
        return true
      })
    }))
    .filter(group => group.items.length > 0)

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#e8e8e4]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#f0f0ec] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0f172a] rounded-lg flex items-center justify-center">
            <span className="text-white text-[9px] font-black tracking-wider">RA</span>
          </div>
          <div>
            <div className="text-xs font-bold text-[#0f172a] leading-tight">Reflect</div>
            <div className="text-[9px] text-[#aaa] leading-tight">Architects OS</div>
          </div>
        </div>
        <button onClick={onSearch} className="p-1.5 rounded-md hover:bg-[#f5f5f0] text-[#aaa] hover:text-[#555]">
          <IconSearch size={14} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filteredGroups.map(group => (
          <NavGroup key={group.label} group={group} />
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-[#f0f0ec]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#f5f5f0] cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#0f172a] truncate">{profile?.full_name || 'İstifadəçi'}</div>
            <div className="text-[10px] text-[#aaa] truncate">{isAdmin ? 'Admin' : 'İşçi'}</div>
          </div>
          <button onClick={signOut} className="opacity-0 group-hover:opacity-100 p-1 text-[#aaa] hover:text-red-500 transition-opacity">
            <IconLogout size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
