import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Button, Card, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUsers } from '@tabler/icons-react'

const STAGES = [
  { key: 'lead', label: 'Potensial', color: 'bg-gray-100 text-gray-700' },
  { key: 'proposal', label: 'Təklif', color: 'bg-blue-100 text-blue-700' },
  { key: 'in_progress', label: 'İcrada', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-700' },
  { key: 'archived', label: 'Arxiv', color: 'bg-gray-100 text-gray-500' },
]

const PRIORITIES = [
  { key: 'high', label: 'Yüksək', color: 'danger' },
  { key: 'medium', label: 'Orta', color: 'warning' },
  { key: 'low', label: 'Aşağı', color: 'default' },
]

function ClientForm({ open, onClose, onSave, client }) {
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '', address: '',
    project_type: '', status: 'lead', priority: 'medium', notes: ''
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
            <label className="block text-xs font-medium text-[#555] mb-1">Mərhələ</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
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

function PipelineCard({ client, onEdit, onDelete, onMove }) {
  const pr = PRIORITIES.find(p => p.key === client.priority)
  return (
    <div className="bg-white border border-[#e8e8e4] rounded-lg p-3 mb-2 hover:border-[#0f172a] transition-colors group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="font-medium text-xs text-[#0f172a] truncate flex-1">{client.name}</div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 ml-1">
          <button onClick={() => onEdit(client)} className="text-[#aaa] hover:text-[#0f172a] p-0.5"><IconEdit size={11} /></button>
          <button onClick={() => onDelete(client)} className="text-[#aaa] hover:text-red-500 p-0.5"><IconTrash size={11} /></button>
        </div>
      </div>
      {client.contact_person && <div className="text-[10px] text-[#aaa] mb-1.5">{client.contact_person}</div>}
      {client.project_type && <div className="text-[10px] text-[#555] mb-1.5">{client.project_type}</div>}
      <div className="flex items-center justify-between">
        <Badge variant={pr?.color} size="sm">{pr?.label}</Badge>
        {client.phone && <span className="text-[9px] text-[#aaa]">{client.phone}</span>}
      </div>
      <div className="flex gap-1 mt-2">
        {STAGES.filter(s => s.key !== client.status).slice(0, 2).map(s => (
          <button key={s.key} onClick={() => onMove(client, s.key)}
            className="text-[9px] text-[#aaa] hover:text-[#0f172a] border border-[#e8e8e4] hover:border-[#0f172a] px-1.5 py-0.5 rounded transition-colors">
            → {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { addToast } = useToast()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [deleteClient, setDeleteClient] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = { name: form.name.trim(), contact_person: form.contact_person || null, phone: form.phone || null, email: form.email || null, address: form.address || null, project_type: form.project_type || null, status: form.status, priority: form.priority, notes: form.notes || null }
    if (editClient) {
      const { error } = await supabase.from('clients').update(data).eq('id', editClient.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Sifarişçi yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('clients').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Sifarişçi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditClient(null); await loadData()
  }

  async function handleMove(client, newStatus) {
    await supabase.from('clients').update({ status: newStatus }).eq('id', client.id)
    addToast('Mərhələ dəyişdirildi', 'success')
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('clients').delete().eq('id', deleteClient.id)
    addToast('Sifarişçi silindi', 'success')
    setDeleteClient(null); await loadData()
  }

  const grouped = STAGES.reduce((acc, s) => {
    acc[s.key] = clients.filter(c => c.status === s.key)
    return acc
  }, {})

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Sifarişçi Pipeline"
        subtitle={`${clients.length} sifarişçi`}
        action={<Button onClick={() => { setEditClient(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni sifarişçi</Button>}
      />

      {clients.length === 0 ? (
        <EmptyState icon={IconUsers} title="Hələ sifarişçi yoxdur" description="İlk sifarişçini əlavə edin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Sifarişçi əlavə et</Button>} />
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map(stage => (
            <div key={stage.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stage.color}`}>{stage.label}</span>
                <span className="text-[10px] text-[#aaa]">{grouped[stage.key]?.length || 0}</span>
              </div>
              <div className="min-h-16">
                {(grouped[stage.key] || []).map(c => (
                  <PipelineCard key={c.id} client={c}
                    onEdit={c => { setEditClient(c); setModalOpen(true) }}
                    onDelete={setDeleteClient} onMove={handleMove} />
                ))}
                <button onClick={() => { setEditClient(null); setModalOpen(true) }}
                  className="w-full py-1.5 text-[10px] text-[#ccc] hover:text-[#888] border border-dashed border-[#e8e8e4] hover:border-[#ccc] rounded-lg transition-colors">
                  + Əlavə et
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientForm open={modalOpen} onClose={() => { setModalOpen(false); setEditClient(null) }}
        onSave={handleSave} client={editClient} />
      <ConfirmDialog open={!!deleteClient} title="Sifarişçini sil"
        message={`"${deleteClient?.name}" sifarişçisini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteClient(null)} danger />
    </div>
  )
}
