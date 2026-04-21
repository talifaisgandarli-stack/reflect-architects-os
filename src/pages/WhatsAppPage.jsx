import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button, Skeleton } from '../components/ui'
import { IconBrandWhatsapp, IconSend, IconRobot } from '@tabler/icons-react'

const TEMPLATES = [
  { label: 'Deadline xatırlatması', prompt: 'deadline xatırlatması, tapşırığı vaxtında tamamlamaq barədə' },
  { label: 'Görüş xatırlatması', prompt: 'görüş xatırlatması, hazırlıqlı gəlmək barədə' },
  { label: 'Ödəniş xatırlatması', prompt: 'ödəniş xatırlatması, mükəmməl iş münasibəti üçün' },
  { label: 'Təşəkkür mesajı', prompt: 'gözəl iş üçün təşəkkür, komanda ruhu' },
]

export default function WhatsAppPage() {
  const { addToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ recipient_type: 'member', phone: '', message: '', useAI: false, aiPrompt: '' })
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => { loadMembers() }, [])

  async function loadMembers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name, whatsapp_number').eq('is_active', true).order('full_name')
    setMembers(data || [])
    setLoading(false)
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function selectMember(member) {
    setSelectedMember(member)
    set('phone', member.whatsapp_number || '')
  }

  async function handleSend() {
    const phone = form.phone.trim()
    if (!phone) { addToast('Telefon nömrəsi daxil edin', 'error'); return }
    if (!form.message && !form.useAI) { addToast('Mesaj daxil edin', 'error'); return }
    if (form.useAI && !form.aiPrompt) { addToast('AI üçün mövzu daxil edin', 'error'); return }

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: form.useAI ? null : form.message,
          useAI: form.useAI,
          prompt: form.useAI ? `${selectedMember ? `Alıcı: ${selectedMember.full_name}. ` : ''}${form.aiPrompt}` : null
        })
      })
      const data = await res.json()
      if (data.success) {
        addToast(data.mode === 'test' ? 'Test rejimi — WhatsApp token lazımdır' : 'Mesaj göndərildi! ✓', data.mode === 'test' ? 'warning' : 'success')
        set('message', '')
        set('aiPrompt', '')
      } else {
        addToast('Xəta: ' + (data.error || 'Bilinməyən xəta'), 'error')
      }
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
    setSending(false)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="WhatsApp Manual Mesaj"
        subtitle="Komanda üzvlərinə və ya xarici şəxslərə birbaşa WhatsApp mesajı"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alıcı seçimi */}
        <div>
          <div className="text-xs font-bold text-[#0f172a] mb-3">Alıcı seç</div>
          <div className="space-y-1.5">
            {members.map(m => (
              <button key={m.id} onClick={() => selectMember(m)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${selectedMember?.id === m.id ? 'border-[#0f172a] bg-[#0f172a] text-white' : 'border-[#e8e8e4] hover:border-[#0f172a]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedMember?.id === m.id ? 'bg-white text-[#0f172a]' : 'bg-[#0f172a] text-white'}`}>
                  {m.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${selectedMember?.id === m.id ? 'text-white' : 'text-[#0f172a]'}`}>{m.full_name}</div>
                  <div className={`text-[10px] truncate ${selectedMember?.id === m.id ? 'text-white/70' : 'text-[#aaa]'}`}>
                    {m.whatsapp_number || 'Nömrə yoxdur'}
                  </div>
                </div>
                {m.whatsapp_number && <IconBrandWhatsapp size={14} className={selectedMember?.id === m.id ? 'text-green-300' : 'text-green-500'} />}
              </button>
            ))}

            <div className="pt-2 border-t border-[#e8e8e4]">
              <label className="block text-xs font-medium text-[#555] mb-1">Xarici nömrə</label>
              <input
                value={selectedMember ? '' : form.phone}
                onChange={e => { setSelectedMember(null); set('phone', e.target.value) }}
                placeholder="+994 50 000 00 00"
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              />
            </div>
          </div>
        </div>

        {/* Mesaj yazma */}
        <div className="lg:col-span-2">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Mesaj</div>

          {/* Alıcı göstəricisi */}
          {(selectedMember || form.phone) && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <IconBrandWhatsapp size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">
                {selectedMember ? `${selectedMember.full_name} · ${selectedMember.whatsapp_number}` : form.phone}
              </span>
            </div>
          )}

          {/* AI / Manual seçim */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => set('useAI', false)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${!form.useAI ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
              Manuel yaz
            </button>
            <button onClick={() => set('useAI', true)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${form.useAI ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
              <IconRobot size={13} /> AI ilə yaz
            </button>
          </div>

          {form.useAI ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1">Mövzu / Kontekst</label>
                <textarea
                  value={form.aiPrompt}
                  onChange={e => set('aiPrompt', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
                  placeholder="Nə barədə mesaj yazılsın? (məs: layihə deadlini, ödəniş xatırlatması...)"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-[#555] mb-2">Şablonlar</div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => set('aiPrompt', t.prompt)}
                      className="text-xs px-3 py-1.5 border border-[#e8e8e4] rounded-full hover:border-[#0f172a] hover:text-[#0f172a] transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-[#aaa] flex items-center gap-1">
                <IconRobot size={11} />
                Claude AI Azərbaycan dilində mesajı avtomatik yazacaq
              </div>
            </div>
          ) : (
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
              placeholder="WhatsApp mesajınızı yazın..."
            />
          )}

          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSend}
              disabled={sending || (!selectedMember && !form.phone)}
              className="min-w-32"
            >
              <IconSend size={14} />
              {sending ? 'Göndərilir...' : 'Göndər'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
