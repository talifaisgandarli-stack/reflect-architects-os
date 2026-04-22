import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader, Badge, Card, Button, EmptyState, Skeleton, StatCard } from '../components/ui'
import { IconPhoto, IconBuildings, IconExternalLink } from '@tabler/icons-react'

export default function PortfelPage() {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const completed = projects.filter(p => p.status === 'completed')
  const active = projects.filter(p => p.status === 'active')
  const all = filter === 'all' ? projects : filter === 'completed' ? completed : active

  const TYPES = [...new Set(projects.map(p => p.clients?.name).filter(Boolean))]
  const fmt = n => '₼' + Number(n || 0).toLocaleString()

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Portfel"
        subtitle="Tamamlanmış və aktiv layihələr kataloqu"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Ümumi layihə" value={projects.length} />
        <StatCard label="Tamamlananlar" value={completed.length} variant="success" />
        <StatCard label="Aktiv" value={active.length} variant="info" />
        <StatCard label="Ümumi dəyər" value={fmt(projects.reduce((s, p) => s + Number(p.contract_value || 0), 0))} />
      </div>

      <div className="flex gap-1 mb-5 border-b border-[#e8e8e4]">
        {[
          { key: 'all', label: 'Hamısı', count: projects.length },
          { key: 'completed', label: 'Tamamlananlar', count: completed.length },
          { key: 'active', label: 'Aktiv', count: active.length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === f.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {f.label} <span className="ml-1 text-[10px] text-[#aaa]">{f.count}</span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={IconPhoto} title="Hələ layihə yoxdur"
          description="Layihələr bölməsindən layihə əlavə edin — burada avtomatik görünür" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {all.map(p => (
            <Card key={p.id} className="p-4 hover:border-[#0f172a] transition-colors cursor-pointer">
              {/* Project image placeholder */}
              <div className="h-32 bg-[#f5f5f0] rounded-lg mb-3 flex items-center justify-center">
                <IconBuildings size={32} className="text-[#ddd]" />
              </div>

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0f172a] truncate">{p.name}</div>
                  <div className="text-xs text-[#888] mt-0.5">{p.clients?.name || '—'}</div>
                </div>
                <Badge
                  variant={p.status === 'completed' ? 'success' : p.status === 'active' ? 'info' : 'default'}
                  size="sm"
                >
                  {p.status === 'completed' ? 'Tamamlandı' : p.status === 'active' ? 'İcrada' : 'Gözləyir'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[#aaa] mb-0.5">Dəyər</div>
                  <div className="font-medium text-[#0f172a]">{fmt(p.contract_value)}</div>
                </div>
                <div>
                  <div className="text-[#aaa] mb-0.5">Mərhələ</div>
                  <div className="font-medium text-[#555]">
                    {p.phase === 'concept' ? 'Konsept' :
                     p.phase === 'working_drawings' ? 'İşçi layihə' :
                     p.phase === 'expertise' ? 'Ekspertiza' : 'Müəllif nəzarəti'}
                  </div>
                </div>
                {p.completion_percent > 0 && (
                  <div className="col-span-2">
                    <div className="flex justify-between text-[10px] text-[#aaa] mb-1">
                      <span>Tamamlanma</span>
                      <span>{Math.round(p.completion_percent)}%</span>
                    </div>
                    <div className="h-1 bg-[#f0f0ec] rounded-full">
                      <div className="h-1 bg-[#0f172a] rounded-full" style={{ width: `${Math.min(100, p.completion_percent)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {p.deadline && (
                <div className="mt-2 pt-2 border-t border-[#f5f5f0] text-[10px] text-[#aaa]">
                  Deadline: {new Date(p.deadline).toLocaleDateString('az-AZ')}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
