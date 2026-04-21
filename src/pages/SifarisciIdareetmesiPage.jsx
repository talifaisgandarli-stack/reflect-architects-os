import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUsers, IconPhone, IconMail, IconBuildings } from '@tabler/icons-react'

const STATUSES = [
  { key: 'lead', label: 'Potensial', color: 'default' },
  { key: 'proposal', label: 'Təklif', color: 'info' },
  { key: 'in_progress', label: 'İcrada', color: 'warning' },
  { key: 'completed', label: 'Tamamlandı', color: 'success' },
  { key: 'archived', label: 'Arxiv', color: 'default' },
]

const PRIORITIES = [
  { key: 'high', label: 'Yüksək', color: 'danger' },
  { key: 'medium', label: 'Orta', color: 'warning' },
  { key: 'low', label: 'Aşağı', color: 'default' },
]

function ClientForm({ open, onClose, onSave, client }) {
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    address: '', project_type: '', status: 'lead',
    priority: 'medium', notes: ''
  })

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '', contact_person: client.contact_person || '',
        phone: client.phone || '', email: client.email || '',
        address: client.address || '', project_type: client.project_type || '',
        status: client.status || 'lead', priority: client.priority || 'medium',
        notes: client.notes || ''
      })
    } else {
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '', project_type: '', status: 'lead', priority: 'medium', notes: '' })
    }
  }, [client, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={client ? 'Sifarişçini redaktə et' : 'Yeni sifarişçi'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Şirkət / Ad *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Sifarişçinin adı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Əlaqə şəxsi</label>
            <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ad Soyad" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Telefon</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="+994 50 000 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">E-poçt</label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə növü</label>
            <input value={form.project_type} onChange={e => set('project_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Residential, Commercial..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Ünvan</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Şəhər, rayon..." />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Əlavə məlumat..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{client ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SifarisciIdareetmesiPage() {
  const { addToast } = useToast()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [deleteClient, setDeleteClient] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('table')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [cRes, pRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('id, name, client_id, contract_value, status'),
    ])
    setClients(cRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = {
      name: form.name.trim(), contact_person: form.contact_person || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, project_type: form.project_type || null,
      status: form.status, priority: form.priority, notes: form.notes || null
    }
    if (editClient) {
      const { error } = await supabase.from('clients').update(data).eq('id', editClient.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Sifarişçi yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('clients').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Sifarişçi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditClient(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('clients').delete().eq('id', deleteClient.id)
    addToast('Silindi', 'success')
    setDeleteClient(null); await loadData()
  }

  const getClientProjects = id => projects.filter(p => p.client_id === id)
  const getClientValue = id => getClientProjects(id).reduce((s, p) => s + Number(p.contract_value || 0), 0)

  const filtered = filter === 'all' ? clients : clients.filter(c => c.status === filter)
  const fmt = n => '₼' + Number(n || 0).toLocaleString()

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Sifarişçi İdarəetməsi"
        subtitle={`${clients.length} sifarişçi`}
        action={<Button onClick={() => { setEditClient(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni sifarişçi</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi sifarişçi" value={clients.length} />
        <StatCard label="Aktiv layihə" value={clients.filter(c => c.status === 'in_progress').length} />
        <StatCard label="Tamamlananlar" value={clients.filter(c => c.status === 'completed').length} />
        <StatCard label="Potensial" value={clients.filter(c => c.status === 'lead').length} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label}
            <span className="ml-1 text-[10px] text-[#aaa]">
              {s.key === 'all' ? clients.length : clients.filter(c => c.status === s.key).length}
            </span>
          </button>
        ))}
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={IconUsers} title="Hələ sifarişçi yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Əlaqə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Növ</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Prioritet</th>
                  <th className="text-center px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Ümumi dəyər</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const st = STATUSES.find(s => s.key === c.status)
                  const pr = PRIORITIES.find(p => p.key === c.priority)
                  const clientProjects = getClientProjects(c.id)
                  const clientValue = getClientValue(c.id)
                  return (
                    <tr key={c.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{c.name}</div>
                        {c.address && <div className="text-[10px] text-[#aaa] mt-0.5">{c.address}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#555]">{c.contact_person || '—'}</div>
                        {c.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-[#aaa] mt-0.5">
                            <IconPhone size={9} />{c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[10px] text-[#aaa]">
                            <IconMail size={9} />{c.email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{c.project_type || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={pr?.color} size="sm">{pr?.label}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[#0f172a] font-medium">{clientProjects.length}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">
                        {clientValue > 0 ? fmt(clientValue) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditClient(c); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteClient(c)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ClientForm open={modalOpen} onClose={() => { setModalOpen(false); setEditClient(null) }}
        onSave={handleSave} client={editClient} />
      <ConfirmDialog open={!!deleteClient} title="Sifarişçini sil"
        message={`"${deleteClient?.name}" sifarişçisini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteClient(null)} danger />
    </div>
  )
}
