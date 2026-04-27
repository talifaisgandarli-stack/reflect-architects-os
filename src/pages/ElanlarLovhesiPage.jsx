import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { notify, notifyAll } from '../components/layout/MainLayout'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconSpeakerphone } from '@tabler/icons-react'

const PRIORITIES = [
  { key: 'urgent', label: 'Təcili', color: 'danger' },
  { key: 'normal', label: 'Normal', color: 'default' },
  { key: 'info', label: 'Məlumat', color: 'info' },
]

const ICONS = ['📢', '🔔', '⚠️', '✅', '🎉', '📅', '💼', '🏆', '📌', '❗']

// notices cədvəlinin mövcud sütunları: id, title, content, priority, created_at
// Əlavə sütunlar (migration sonra): icon, tagged_profiles, tag_team
// Hər iki halda işləyir

function ElanForm({ open, onClose, onSave, elan, members, hasExtraCols }) {
  const [form, setForm] = useState({
    title: '', content: '', priority: 'normal',
    icon: '📢', tagged_profiles: [], tag_team: false
  })

  useEffect(() => {
    if (elan) {
      setForm({
        title: elan.title || '',
        content: elan.content || '',
        priority: elan.priority || 'normal',
        icon: elan.icon || '📢',
        tagged_profiles: elan.tagged_profiles || [],
        tag_team: elan.tag_team || false
      })
    } else {
      setForm({ title: '', content: '', priority: 'normal', icon: '📢', tagged_profiles: [], tag_team: false })
    }
  }, [elan, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleMember(id) {
    setForm(f => ({
      ...f,
      tagged_profiles: f.tagged_profiles.includes(id)
        ? f.tagged_profiles.filter(x => x !== id)
        : [...f.tagged_profiles, id]
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title={elan ? 'Elanı redaktə et' : 'Yeni elan'}>
      <div className="space-y-3">

        {/* İkon seçimi — yalnız migration varsa */}
        {hasExtraCols && (
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İkon</label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => set('icon', ic)}
                  className={`text-lg p-1.5 rounded-lg border-2 transition-colors ${
                    form.icon === ic ? 'border-[#0f172a] bg-[#f5f5f0]' : 'border-transparent hover:border-[#e8e8e4]'
                  }`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Başlıq *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Elanın başlığı"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
            {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Məzmun</label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Elanın tam mətni..."
          />
        </div>

        {/* Tag — yalnız migration varsa */}
        {hasExtraCols && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#555]">İşçiləri tag et</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tag_team}
                  onChange={e => set('tag_team', e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0f172a]"
                />
                <span className="text-xs text-[#555]">Bütün komanda</span>
              </label>
            </div>
            {!form.tag_team && members.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 border border-[#e8e8e4] rounded-lg max-h-28 overflow-y-auto">
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.tagged_profiles.includes(m.id)
                        ? 'bg-[#0f172a] text-white border-[#0f172a]'
                        : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
                    }`}
                  >
                    {m.full_name}
                  </button>
                ))}
              </div>
            )}
            {(form.tag_team || form.tagged_profiles.length > 0) && (
              <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                <span>📩</span>
                <span>Telegram bildirişi göndəriləcək</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            {elan ? 'Yadda saxla' : 'Dərc et'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ElanCard({ elan, members, onEdit, onDelete, isAdmin }) {
  const pr = PRIORITIES.find(p => p.key === elan.priority)
  const taggedNames = (elan.tagged_profiles || [])
    .map(id => members.find(m => m.id === id)?.full_name)
    .filter(Boolean)

  return (
    <div className={`bg-white border rounded-xl p-4 mb-3 group transition-colors ${
      elan.priority === 'urgent' ? 'border-red-200 bg-red-50/30' : 'border-[#e8e8e4] hover:border-[#d0d0cc]'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{elan.icon || '📢'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold text-[#0f172a]">{elan.title}</span>
                <Badge variant={pr?.color} size="sm">{pr?.label}</Badge>
              </div>
              {elan.content && (
                <p className="text-xs text-[#555] leading-relaxed">{elan.content}</p>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => onEdit(elan)} className="text-[#aaa] hover:text-[#0f172a] p-1 rounded">
                  <IconEdit size={13} />
                </button>
                <button onClick={() => onDelete(elan)} className="text-[#aaa] hover:text-red-500 p-1 rounded">
                  <IconTrash size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-[#aaa]">
              {new Date(elan.created_at).toLocaleDateString('az-AZ')}
            </span>
            {elan.tag_team && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                👥 Bütün komanda
              </span>
            )}
            {!elan.tag_team && taggedNames.length > 0 && taggedNames.map(name => (
              <span key={name} className="text-[10px] bg-[#f0f0ec] text-[#555] px-2 py-0.5 rounded-full">
                @{name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ElanlarLovhesiPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()
  const [elanlar, setElanlar] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editElan, setEditElan] = useState(null)
  const [deleteElan, setDeleteElan] = useState(null)
  const [hasExtraCols, setHasExtraCols] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [eRes, mRes] = await Promise.all([
      supabase.from('notices').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
    ])

    const data = eRes.data || []
    // icon sütunu varsa migration tamamdır
    const extra = data.length > 0
      ? 'icon' in data[0]
      : await checkExtraCols()
    setHasExtraCols(extra)
    setElanlar(data)
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function checkExtraCols() {
    const { data } = await supabase.from('notices').select('icon').limit(1)
    return data !== null
  }

  async function sendTelegramNotification(form) {
    try {
      const text = `${form.icon || '📢'} *${form.title}*\n\n${form.content || ''}`
      let chatIds = []

      if (form.tag_team) {
        const { data } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .not('telegram_chat_id', 'is', null)
        chatIds = (data || []).map(p => p.telegram_chat_id).filter(Boolean)
      } else if ((form.tagged_profiles || []).length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .in('id', form.tagged_profiles)
          .not('telegram_chat_id', 'is', null)
        chatIds = (data || []).map(p => p.telegram_chat_id).filter(Boolean)
      }

      for (const chatId of chatIds) {
        await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sendMessage', chat_id: chatId, text })
        })
      }
    } catch (err) {
      console.error('Telegram error:', err)
    }
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Başlıq daxil edin', 'error'); return }

    // Əsas data — həmişə mövcud sütunlar
    const baseData = {
      title: form.title.trim(),
      content: form.content || null,
      priority: form.priority,
    }

    // Extra sütunlar yalnız migration olduqda
    const fullData = hasExtraCols ? {
      ...baseData,
      icon: form.icon || '📢',
      tagged_profiles: form.tag_team ? [] : (form.tagged_profiles || []),
      tag_team: form.tag_team || false,
    } : baseData

    let error = null

    if (editElan) {
      const res = await supabase.from('notices').update(fullData).eq('id', editElan.id)
      error = res.error
      if (!error) addToast('Elan yeniləndi', 'success')
    } else {
      const res = await supabase.from('notices').insert(fullData)
      error = res.error
      if (!error) {
        addToast('Elan dərc edildi', 'success')
        // Telegram bildirişi
        if (hasExtraCols && (form.tag_team || (form.tagged_profiles || []).length > 0)) {
          sendTelegramNotification(form)
        }
      }
    }

    if (error) { addToast('Xəta: ' + error.message, 'error'); return }

    setModalOpen(false)
    setEditElan(null)
    await loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('notices').delete().eq('id', deleteElan.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast('Elan silindi', 'success')
    setDeleteElan(null)
    await loadData()
  }

  const urgent = elanlar.filter(e => e.priority === 'urgent')
  const others = elanlar.filter(e => e.priority !== 'urgent')

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-[#0f172a]">Elanlar Lövhəsi</h1>
          <p className="text-xs text-[#888] mt-0.5">{elanlar.length} elan</p>
        </div>
        <Button onClick={() => { setEditElan(null); setModalOpen(true) }} size="sm">
          <IconPlus size={14} /> Yeni elan
        </Button>
      </div>

      {elanlar.length === 0 ? (
        <EmptyState icon={IconSpeakerphone} title="Hələ elan yoxdur"
          description={isAdmin ? 'Yeni elan əlavə etmək üçün yuxarıdakı düyməni basın' : 'Hələ heç bir elan dərc edilməyib'} />
      ) : (
        <div>
          {urgent.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">🔴 Təcili elanlar</div>
              {urgent.map(e => (
                <ElanCard key={e.id} elan={e} members={members} isAdmin={isAdmin}
                  onEdit={e2 => { setEditElan(e2); setModalOpen(true) }}
                  onDelete={setDeleteElan} />
              ))}
            </div>
          )}
          {others.length > 0 && (
            <div>
              {urgent.length > 0 && (
                <div className="text-xs font-bold text-[#888] uppercase tracking-wide mb-2">Digər elanlar</div>
              )}
              {others.map(e => (
                <ElanCard key={e.id} elan={e} members={members} isAdmin={isAdmin}
                  onEdit={e2 => { setEditElan(e2); setModalOpen(true) }}
                  onDelete={setDeleteElan} />
              ))}
            </div>
          )}
        </div>
      )}

      <ElanForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditElan(null) }}
        onSave={handleSave}
        elan={editElan}
        members={members}
        hasExtraCols={hasExtraCols}
      />
      <ConfirmDialog
        open={!!deleteElan}
        title="Elanı sil"
        message={`"${deleteElan?.title}" elanını silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteElan(null)}
        danger
      />
    </div>
  )
}
