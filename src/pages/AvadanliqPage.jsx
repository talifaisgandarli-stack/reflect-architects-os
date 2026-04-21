import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconDeviceLaptop } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

const CATEGORIES = ['Kompüter', 'Monitor', 'Printer', 'Kamera', 'Mebel', 'Avadanlıq', 'Proqram', 'Digər']
const STATUSES = [
  { key: 'active', label: 'Aktiv', color: 'success' },
  { key: 'repair', label: 'Təmirdə', color: 'warning' },
  { key: 'storage', label: 'Anbar', color: 'default' },
  { key: 'disposed', label: 'Silinib', color: 'danger' },
]

function EquipForm({ open, onClose, onSave, item }) {
  const [form, setForm] = useState({ name: '', category: 'Kompüter', serial_number: '', purchase_date: '', purchase_price: '', assigned_to: '', status: 'active', notes: '' })

  useState(() => {
    if (item) setForm({ name: item.name || '', category: item.category || 'Kompüter', serial_number: item.serial_number || '', purchase_date: item.purchase_date || '', purchase_price: item.purchase_price || '', assigned_to: item.assigned_to || '', status: item.status || 'active', notes: item.notes || '' })
    else setForm({ name: '', category: 'Kompüter', serial_number: '', purchase_date: '', purchase_price: '', assigned_to: '', status: 'active', notes: '' })
  }, [item, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Avadanlığı redaktə et' : 'Yeni avadanlıq'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Ad *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="MacBook Pro, Canon EOS..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Kateqoriya</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Serial nömrə</label>
            <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="SN-XXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Alış tarixi</label>
            <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Alış qiyməti (₼)</label>
            <input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məsul şəxs</label>
            <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ad Soyad" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{item ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function AvadanliqPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [filter, setFilter] = useState('all')

  function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form } : i))
      addToast('Yeniləndi', 'success')
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), ...form }])
      addToast('Avadanlıq əlavə edildi', 'success')
    }
    setModalOpen(false); setEditItem(null)
  }

  function handleDelete() {
    setItems(prev => prev.filter(i => i.id !== deleteItem.id))
    addToast('Silindi', 'success')
    setDeleteItem(null)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const totalValue = items.filter(i => i.status === 'active').reduce((s, i) => s + Number(i.purchase_price || 0), 0)

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Avadanlıq"
        subtitle={`${items.length} avadanlıq`}
        action={<Button onClick={() => { setEditItem(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni avadanlıq</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi" value={items.length} />
        <StatCard label="Aktiv" value={items.filter(i => i.status === 'active').length} variant="success" />
        <StatCard label="Təmirdə" value={items.filter(i => i.status === 'repair').length} variant="warning" />
        <StatCard label="Ümumi dəyər" value={fmt(totalValue)} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={IconDeviceLaptop} title="Hələ avadanlıq yoxdur"
          description="Kompüter, printer, mebel və digər avadanlıqları qeyd edin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ad</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Kateqoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Serial №</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Məsul</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Alış tarixi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Qiymət</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const st = STATUSES.find(s => s.key === item.status)
                  return (
                    <tr key={item.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{item.name}</td>
                      <td className="px-4 py-3"><Badge variant="default" size="sm">{item.category}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{item.serial_number || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{item.assigned_to || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString('az-AZ') : '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{item.purchase_price > 0 ? fmt(item.purchase_price) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(item); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteItem(item)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
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

      <EquipForm open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null) }} onSave={handleSave} item={editItem} />
      <ConfirmDialog open={!!deleteItem} title="Avadanlığı sil" message={`"${deleteItem?.name}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} danger />
    </div>
  )
}
