import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button } from '../components/ui'
import { IconBrandTelegram, IconRobot, IconDownload, IconRefresh, IconSend } from '@tabler/icons-react'

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#0f172a]' : 'bg-[#e8e8e4]'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

const NOTIFICATION_TYPES = [
  { key: 'daily_summary', icon: '☀️', label: 'Günlük xülasə', desc: 'Hər gün saat 08:00 — hər işçiyə şəxsi' },
  { key: 'deadline_warning', icon: '⏰', label: 'Deadline xəbərdarlıqları', desc: '7, 3, 1 gün əvvəl' },
  { key: 'meeting_reminder', icon: '📅', label: 'Görüş xatırlatmaları', desc: '24 saat əvvəl' },
  { key: 'weekly_report', icon: '📊', label: 'Həftəlik hesabat', desc: 'Hər Cümə saat 17:00' },
]

export default function ParametrlerPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({
    agent_enabled: true,
    telegram_enabled: true,
    daily_summary: true,
    deadline_warning: true,
    meeting_reminder: true,
    weekly_report: true,
  })
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(null)
  const [manualMessage, setManualMessage] = useState('')
  const [manualTarget, setManualTarget] = useState('all')
  const [sendingManual, setSendingManual] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    // Settings yüklə
    const { data } = await supabase.from('system_settings').select('key, value')
    if (data) {
      const s = {}
      data.forEach(row => { s[row.key] = row.value === 'true' || row.value === true })
      setSettings(prev => ({ ...prev, ...s }))
    }
    // Qeydiyyatlı Telegram istifadəçiləri
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)
    setRegisteredUsers(profiles || [])
    setLoading(false)
  }

  async function saveSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
    await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' })
  }

  async function testNotification(type) {
    setTesting(type)
    try {
      const res = await fetch(`/api/agent?type=${type}`)
      const data = await res.json()
      if (data.success) {
        addToast(`Test göndərildi — ${data.count} nəfərə`, 'success')
      } else {
        addToast('Xəta: ' + (data.error || 'Bilinməyən xəta'), 'error')
      }
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
    setTesting(null)
  }

  async function exportData() {
    const [projects, tasks, incomes, expenses] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('incomes').select('*'),
      supabase.from('expenses').select('*'),
    ])
    const data = {
      exported_at: new Date().toISOString(),
      projects: projects.data,
      tasks: tasks.data,
      incomes: incomes.data,
      expenses: expenses.data,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reflect-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
    addToast('Məlumatlar ixrac edildi', 'success')
  }

  async function removeTelegramUser(id) {
    await supabase.from('profiles').update({ telegram_chat_id: null }).eq('id', id)
    addToast('Telegram əlaqəsi silindi', 'success')
    await loadData()
  }

  async function sendManual() {
    if (!manualMessage.trim()) return
    setSendingManual(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send_manual', message: manualMessage, target: manualTarget })
      })
      const data = await res.json()
      if (data.success) {
        addToast(`Mesaj göndərildi — ${data.count} nəfərə`, 'success')
        setManualMessage('')
      } else {
        addToast('Xəta: ' + (data.error || 'Bilinməyən'), 'error')
      }
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
    setSendingManual(false)
  }

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader title="Parametrlər" subtitle="Sistem tənzimləmələri" />

      <div className="space-y-4 max-w-2xl">

        {/* AI Agent */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconRobot size={18} className="text-[#0f172a]" />
              <div>
                <div className="text-sm font-bold text-[#0f172a]">AI Agent</div>
                <div className="text-xs text-[#888]">Bütün avtomatik bildirişlər</div>
              </div>
            </div>
            <Toggle checked={settings.agent_enabled} onChange={v => saveSetting('agent_enabled', v)} />
          </div>

          {settings.agent_enabled && (
            <div className="space-y-3 border-t border-[#f0f0ec] pt-3">
              {NOTIFICATION_TYPES.map(n => (
                <div key={n.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{n.icon}</span>
                    <div>
                      <div className="text-xs font-medium text-[#0f172a]">{n.label}</div>
                      <div className="text-[10px] text-[#888]">{n.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => testNotification(n.key)} disabled={testing === n.key}
                      className="text-[10px] text-blue-500 hover:text-blue-700 disabled:opacity-50">
                      {testing === n.key ? '...' : 'Test'}
                    </button>
                    <Toggle checked={settings[n.key]} onChange={v => saveSetting(n.key, v)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Telegram */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBrandTelegram size={18} className="text-blue-500" />
              <div>
                <div className="text-sm font-bold text-[#0f172a]">Telegram bildirişləri</div>
                <div className="text-xs text-[#888]">@reflect_architects_bot vasitəsilə</div>
              </div>
            </div>
            <Toggle checked={settings.telegram_enabled} onChange={v => saveSetting('telegram_enabled', v)} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-800">
            <div className="font-medium mb-1">Əməkdaşlar necə qeydiyyat keçir:</div>
            <div>1. Telegram-da <strong>@reflect_architects_bot</strong>-a yazın</div>
            <div>2. <strong>/start</strong> göndərin</div>
            <div>3. Sistemdəki tam adı yazın</div>
          </div>

          {registeredUsers.length > 0 ? (
            <div>
              <div className="text-xs font-medium text-[#555] mb-2">Qeydiyyatlı ({registeredUsers.length} nəfər):</div>
              <div className="space-y-1.5">
                {registeredUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-[#f5f5f0] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 text-[9px] font-bold">
                          {u.full_name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </span>
                      </div>
                      <span className="text-xs text-[#0f172a]">{u.full_name}</span>
                    </div>
                    <button onClick={() => removeTelegramUser(u.id)} className="text-[10px] text-[#aaa] hover:text-red-500">Sil</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#aaa] text-center py-2">
              Hələ qeydiyyatlı istifadəçi yoxdur
            </div>
          )}
        </Card>

        {/* Manual Telegram mesajı */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconBrandTelegram size={18} className="text-blue-500" />
            <div className="text-sm font-bold text-[#0f172a]">Manual mesaj göndər</div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Kimə</label>
              <select value={manualTarget} onChange={e => setManualTarget(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
                <option value="all">Hamısına</option>
                {registeredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Mesaj</label>
              <textarea value={manualMessage} onChange={e => setManualMessage(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
                placeholder="Mesajınızı yazın..." />
            </div>
            <Button onClick={sendManual} disabled={!manualMessage.trim() || sendingManual} className="w-full">
              <IconSend size={14} /> {sendingManual ? 'Göndərilir...' : 'Göndər'}
            </Button>
          </div>
        </Card>

        {/* Məlumat ehtiyatı */}
        <Card className="p-4">
          <div className="text-sm font-bold text-[#0f172a] mb-3">Məlumat ehtiyatı</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#555]">JSON ixrac</div>
              <div className="text-[10px] text-[#888]">Bütün layihə, tapşırıq, maliyyə məlumatları</div>
            </div>
            <Button variant="secondary" size="sm" onClick={exportData}>
              <IconDownload size={13} /> Yüklə
            </Button>
          </div>
        </Card>

        {/* Sistem məlumatları */}
        <Card className="p-4">
          <div className="text-sm font-bold text-[#0f172a] mb-3">Sistem məlumatları</div>
          <div className="space-y-2 text-xs">
            {[
              ['Şirkət', 'Reflect Architects'],
              ['Ünvan', 'Bakı, Azərbaycan'],
              ['E-poçt', 'info@reflect.az'],
              ['Sistem versiyası', 'v1.0 · 2026'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[#888]">{k}</span>
                <span className="font-medium text-[#0f172a]">{v}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
