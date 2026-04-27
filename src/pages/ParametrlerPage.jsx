import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button } from '../components/ui'
import {
  IconBrandTelegram, IconRobot, IconDownload, IconSend,
  IconClock, IconUser, IconCheck, IconX
} from '@tabler/icons-react'

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// Yeni bildiriş sistemi
const NOTIFICATIONS = [
  {
    key: 'morning',
    icon: '🌅',
    label: 'İşçi Şəxsi Brifinqi',
    desc: 'Hər gün saat 09:00 — hər işçiyə fərdi (tapşırıqlar, gecikmiş, deadlinelər, hadisələr)',
    audience: 'Bütün komanda',
    time: '09:00',
  },
  {
    key: 'morning_admin',
    icon: '📊',
    label: 'Admin Səhər Hesabatı',
    desc: 'Hər gün saat 09:00 — komanda vəziyyəti, maliyyə, BD məlumatları',
    audience: 'Nicat · Talifa · Türkan',
    time: '09:00',
  },
  {
    key: 'outsource_deadline',
    icon: '🔧',
    label: 'Podratçı Deadline Xəbərdarlığı',
    desc: '5, 3, 1 gün əvvəl — podratçı adı və layihə məlumatı (ödəniş qeyd edilmir)',
    audience: 'Nicat · Talifa · Türkan + Layihə memarı',
    time: '09:00',
  },
  {
    key: 'nicat_events',
    icon: '📅',
    label: 'Günün Görüşlərinin Xülasəsi',
    desc: 'Hər gün saat 09:30 — bu günün bütün hadisələri və görüşləri',
    audience: 'Yalnız Nicat Nusalov',
    time: '09:30',
  },
  {
    key: 'deadline_warning',
    icon: '⏰',
    label: 'Tapşırıq Deadline Xəbərdarlığı',
    desc: 'Hər gün saat 14:00 — 1, 3, 5 gün qalan tapşırıqlar (Gemini yazır)',
    audience: 'Cavabdeh işçi',
    time: '14:00',
  },
  {
    key: 'evening',
    icon: '🌆',
    label: 'Axşam Memarlıq Sitatı',
    desc: 'Hər gün saat 18:00 — 4 tonlu Gemini AI sitatı (fəlsəfi · sarkazm · emosional · düşündürücü)',
    audience: 'Bütün komanda',
    time: '18:00',
  },
  {
    key: 'weekly_report',
    icon: '📈',
    label: 'Həftəlik Hesabat',
    desc: 'Hər Cümə saat 17:00 — maliyyə, tapşırıqlar, deadline dəyişiklikləri, BD',
    audience: 'Nicat · Talifa · Türkan',
    time: 'Cümə 17:00',
  },
]

export default function ParametrlerPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({
    agent_enabled: true,
    telegram_enabled: true,
    morning: true,
    morning_admin: true,
    outsource_deadline: true,
    nicat_events: true,
    deadline_warning: true,
    evening: true,
    weekly_report: true,
  })
  const [loading,        setLoading]        = useState(true)
  const [testing,        setTesting]        = useState(null)
  const [testResult,     setTestResult]     = useState({})
  const [manualMessage,  setManualMessage]  = useState('')
  const [manualTarget,   setManualTarget]   = useState('all')
  const [sendingManual,  setSendingManual]  = useState(false)
  const [registeredUsers,setRegisteredUsers]= useState([])
  const [allProfiles,    setAllProfiles]    = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [settingsRes, profilesRes, allRes] = await Promise.all([
      supabase.from('system_settings').select('key, value'),
      supabase.from('profiles').select('id, full_name, telegram_chat_id').not('telegram_chat_id', 'is', null),
      supabase.from('profiles').select('id, full_name, telegram_chat_id').eq('is_active', true),
    ])
    if (settingsRes.data) {
      const s = {}
      settingsRes.data.forEach(r => { s[r.key] = r.value === 'true' || r.value === true })
      setSettings(prev => ({ ...prev, ...s }))
    }
    setRegisteredUsers(profilesRes.data || [])
    setAllProfiles(allRes.data || [])
    setLoading(false)
  }

  async function saveSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
    await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' })
  }

  async function testNotification(type) {
    setTesting(type)
    setTestResult(prev => ({ ...prev, [type]: null }))
    try {
      const res  = await fetch(`/api/agent?type=${type}`)
      const data = await res.json()
      if (data.success !== false) {
        addToast(`"${NOTIFICATIONS.find(n=>n.key===type)?.label}" göndərildi — ${data.count ?? '?'} nəfərə`, 'success')
        setTestResult(prev => ({ ...prev, [type]: 'ok' }))
      } else {
        addToast('Xəta: ' + (data.error || 'Bilinməyən xəta'), 'error')
        setTestResult(prev => ({ ...prev, [type]: 'err' }))
      }
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
      setTestResult(prev => ({ ...prev, [type]: 'err' }))
    }
    setTesting(null)
  }

  async function sendManual() {
    if (!manualMessage.trim()) return
    setSendingManual(true)
    try {
      // Seçilmiş hədəfin chat_id-sini tap
      let chat_id = null
      if (manualTarget !== 'all') {
        const p = registeredUsers.find(u => u.id === manualTarget)
        chat_id = p?.telegram_chat_id
        if (!chat_id) { addToast('Bu istifadəçinin Telegram-ı yoxdur', 'error'); setSendingManual(false); return }
      }
      // Hamısına göndər
      if (manualTarget === 'all') {
        let count = 0
        for (const u of registeredUsers) {
          const res  = await fetch('/api/agent', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'send_manual', chat_id: u.telegram_chat_id, message: manualMessage })
          })
          const d = await res.json()
          if (d.success) count++
        }
        addToast(`Mesaj göndərildi — ${count} nəfərə`, 'success')
      } else {
        const res  = await fetch('/api/agent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'send_manual', chat_id, message: manualMessage })
        })
        const d = await res.json()
        if (d.success) addToast('Mesaj göndərildi', 'success')
        else addToast('Xəta: ' + (d.error || 'Bilinməyən'), 'error')
      }
      setManualMessage('')
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
    setSendingManual(false)
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
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `reflect-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    addToast('Məlumatlar ixrac edildi', 'success')
  }

  async function removeTelegramUser(id) {
    await supabase.from('profiles').update({ telegram_chat_id: null }).eq('id', id)
    addToast('Telegram əlaqəsi silindi', 'success')
    await loadData()
  }

  // Qeydiyyatsız işçilər
  const unregistered = allProfiles.filter(p => !p.telegram_chat_id)

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader title="Parametrlər" subtitle="Sistem tənzimləmələri" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">

        {/* SOL SÜTUN */}
        <div className="space-y-4">

          {/* AI Agent toggle */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#0f172a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconRobot size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0f172a]">AI Agent</div>
                  <div className="text-xs text-[#888]">Bütün avtomatik bildirişlər</div>
                </div>
              </div>
              <Toggle checked={settings.agent_enabled} onChange={v => saveSetting('agent_enabled', v)} />
            </div>
          </Card>

          {/* Bildiriş sistemi */}
          <Card className="p-4">
            <div className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">
              Bildiriş cədvəli
            </div>
            <div className="space-y-0">
              {NOTIFICATIONS.map((n, i) => (
                <div key={n.key}
                  className={`flex items-start gap-3 py-3 ${i < NOTIFICATIONS.length - 1 ? 'border-b border-[#f5f5f0]' : ''}`}>
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#0f172a]">{n.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0f0ec] text-[#888]">
                        <IconClock size={8} className="inline mr-0.5" />{n.time}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#888] mt-0.5 leading-relaxed">{n.desc}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <IconUser size={9} className="text-[#bbb]" />
                      <span className="text-[9px] text-[#aaa]">{n.audience}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    {/* Test nəticəsi */}
                    {testResult[n.key] === 'ok'  && <IconCheck size={12} className="text-green-500" />}
                    {testResult[n.key] === 'err' && <IconX     size={12} className="text-red-500"   />}
                    <button
                      onClick={() => testNotification(n.key)}
                      disabled={testing === n.key || !settings.agent_enabled}
                      className="text-[10px] font-medium text-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                      {testing === n.key ? '...' : 'Test'}
                    </button>
                    <Toggle
                      checked={settings[n.key] !== false}
                      onChange={v => saveSetting(n.key, v)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Məlumat ehtiyatı */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#0f172a]">Məlumat ehtiyatı</div>
                <div className="text-xs text-[#888] mt-0.5">JSON — layihə, tapşırıq, maliyyə</div>
              </div>
              <Button variant="secondary" size="sm" onClick={exportData}>
                <IconDownload size={13} /> Yüklə
              </Button>
            </div>
          </Card>

        </div>

        {/* SAĞ SÜTUN */}
        <div className="space-y-4">

          {/* Telegram qeydiyyat */}
          <Card className="p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconBrandTelegram size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0f172a]">Telegram</div>
                <div className="text-xs text-[#888]">@reflect_architects_bot</div>
              </div>
              <div className="ml-auto">
                <Toggle checked={settings.telegram_enabled} onChange={v => saveSetting('telegram_enabled', v)} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-800">
              <div className="font-semibold mb-1.5">Qeydiyyat — 3 addım:</div>
              <div className="space-y-1">
                <div>1. Telegram-da <strong>@reflect_architects_bot</strong>-a yazın</div>
                <div>2. <strong>/start</strong> göndərin</div>
                <div>3. Sistemdəki tam adı yazın (məs: <strong>Zeynəb Tarıverdiyeva</strong>)</div>
              </div>
            </div>

            {/* Qeydiyyatlılar */}
            <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">
              Qeydiyyatlı — {registeredUsers.length} nəfər
            </div>
            {registeredUsers.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {registeredUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-[#f8fafb] border border-[#e8f4ff] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[8px] font-bold">
                          {u.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#0f172a]">{u.full_name}</span>
                      <span className="text-[9px] text-green-600 font-medium">✓ aktiv</span>
                    </div>
                    <button onClick={() => removeTelegramUser(u.id)}
                      className="text-[10px] text-[#bbb] hover:text-red-500 transition-colors">
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#bbb] text-center py-3">Hələ qeydiyyatlı istifadəçi yoxdur</div>
            )}

            {/* Qeydiyyatsızlar */}
            {unregistered.length > 0 && (
              <>
                <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2 mt-3">
                  Qeydiyyatsız — {unregistered.length} nəfər
                </div>
                <div className="space-y-1">
                  {unregistered.map(u => (
                    <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fafaf8]">
                      <div className="w-5 h-5 bg-[#e8e8e4] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#888] text-[7px] font-bold">
                          {u.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </span>
                      </div>
                      <span className="text-xs text-[#888]">{u.full_name}</span>
                      <span className="text-[9px] text-[#bbb] ml-auto">qeydiyyat yoxdur</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Manual mesaj */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconSend size={15} className="text-[#0f172a]" />
              <div className="text-sm font-bold text-[#0f172a]">Manual mesaj göndər</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Kimə</label>
                <select value={manualTarget} onChange={e => setManualTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
                  <option value="all">Hamısına ({registeredUsers.length} nəfər)</option>
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Mesaj</label>
                <textarea value={manualMessage} onChange={e => setManualMessage(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a] resize-none"
                  placeholder="Mesajınızı yazın..." />
              </div>
              <Button onClick={sendManual} disabled={!manualMessage.trim() || sendingManual} className="w-full">
                <IconSend size={13} />
                {sendingManual ? 'Göndərilir...' : 'Göndər'}
              </Button>
            </div>
          </Card>

          {/* Sistem məlumatları */}
          <Card className="p-4">
            <div className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Sistem məlumatları</div>
            <div className="space-y-2 text-xs">
              {[
                ['Şirkət', 'Reflect Architects'],
                ['Ünvan', 'Bakı, Azərbaycan'],
                ['E-poçt', 'info@reflect.az'],
                ['Telegram bot', '@reflect_architects_bot'],
                ['Sistem versiyası', 'v2.0 · 2026'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1 border-b border-[#f8f8f5] last:border-0">
                  <span className="text-[#aaa]">{k}</span>
                  <span className="font-medium text-[#0f172a]">{v}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
