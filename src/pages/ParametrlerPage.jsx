import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button, Skeleton } from '../components/ui'
import { IconSettings, IconRobot, IconBrandWhatsapp, IconDownload } from '@tabler/icons-react'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 flex-shrink-0 ${checked ? 'bg-[#0f172a] justify-end' : 'bg-[#e8e8e4] justify-start'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
    </button>
  )
}

const NOTIF_LABELS = {
  agent_enabled: { label: 'AI Agent', desc: 'Bütün avtomatik bildirişlər — söndürdükdə xərc sıfırlanır', icon: '🤖', group: 'agent' },
  daily_summary: { label: 'Günlük xülasə', desc: 'Hər gün saat 08:00 — hər işçiyə şəxsi', icon: '☀️', group: 'notif' },
  deadline_warnings: { label: 'Deadline xəbərdarlıqları', desc: '3 gün, 1 gün, deadline günü', icon: '⏰', group: 'notif' },
  meeting_reminders: { label: 'Görüş xatırlatmaları', desc: '24 saat + 1 saat əvvəl', icon: '📅', group: 'notif' },
  outsource_deadlines: { label: 'Podrat deadline', desc: '7, 3, 1 gün əvvəl — podratçıya + menecerə', icon: '🤝', group: 'notif' },
  finance_alerts: { label: 'Maliyyə bildirişləri', desc: 'Gecikmiş alacaqlar — yalnız Founding Architect', icon: '💰', group: 'notif' },
  transfer_reminders: { label: 'Köçürmə xatırlatması', desc: '60 gün limitinə yaxınlaşanda', icon: '🔄', group: 'notif' },
  weekly_report: { label: 'Həftəlik hesabat', desc: 'Hər Cümə saat 17:00', icon: '📊', group: 'notif' },
  monthly_report: { label: 'Aylıq icmal', desc: 'Hər ayın 1-i — yalnız Founding Architect', icon: '📈', group: 'notif' },
  whatsapp_auto: { label: 'WhatsApp avtomatik', desc: 'Avtomatik bildirişlər WhatsApp-a göndərilir', icon: '📱', group: 'whatsapp' },
  whatsapp_manual: { label: 'WhatsApp manual mesaj', desc: 'Sistem daxilindən birbaşa mesaj göndərmə', icon: '✉️', group: 'whatsapp' },
}

export default function ParametrlerPage() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from('notification_settings').select('*')
    const map = {}
    ;(data || []).forEach(s => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }

  async function toggleSetting(key, value) {
    setSaving(key)
    const { error } = await supabase
      .from('notification_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
    if (error) { addToast('Xəta: ' + error.message, 'error') }
    else {
      setSettings(s => ({ ...s, [key]: value }))
      addToast(value ? 'Aktiv edildi' : 'Söndürüldü', 'success')
    }
    setSaving(null)
  }

  async function exportData() {
    const tables = ['projects', 'tasks', 'clients', 'incomes', 'expenses', 'outsource_works', 'receivables']
    const result = {}
    for (const t of tables) {
      const { data } = await supabase.from(t).select('*')
      result[t] = data || []
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reflect-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    addToast('Məlumatlar yükləndi', 'success')
  }

  const agentEnabled = settings['agent_enabled']

  const agentKeys = ['agent_enabled']
  const notifKeys = ['daily_summary', 'deadline_warnings', 'meeting_reminders', 'outsource_deadlines', 'finance_alerts', 'transfer_reminders', 'weekly_report', 'monthly_report']
  const waKeys = ['whatsapp_auto', 'whatsapp_manual']

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader title="Parametrlər" subtitle="Sistem tənzimləmələri" />

      {/* AI Agent */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <IconRobot size={16} className="text-[#0f172a]" />
          <h2 className="text-sm font-bold text-[#0f172a]">AI Agent</h2>
        </div>
        <Card>
          {agentKeys.map(key => {
            const info = NOTIF_LABELS[key]
            return (
              <div key={key} className="flex items-center gap-4 px-4 py-4 border-b border-[#f5f5f0] last:border-0">
                <span className="text-lg">{info.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0f172a]">{info.label}</div>
                  <div className="text-xs text-[#888] mt-0.5">{info.desc}</div>
                </div>
                <Toggle
                  checked={!!settings[key]}
                  onChange={v => toggleSetting(key, v)}
                  disabled={saving === key}
                />
              </div>
            )
          })}
        </Card>
      </div>

      {/* Bildiriş növləri */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔔</span>
          <h2 className="text-sm font-bold text-[#0f172a]">Bildiriş növləri</h2>
          {!agentEnabled && <span className="text-xs text-[#aaa] ml-1">(Agent söndürülüb — bütün bildirişlər deaktivdir)</span>}
        </div>
        <Card>
          {notifKeys.map(key => {
            const info = NOTIF_LABELS[key]
            return (
              <div key={key} className={`flex items-center gap-4 px-4 py-3.5 border-b border-[#f5f5f0] last:border-0 ${!agentEnabled ? 'opacity-40' : ''}`}>
                <span className="text-base">{info.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0f172a]">{info.label}</div>
                  <div className="text-xs text-[#888] mt-0.5">{info.desc}</div>
                </div>
                <Toggle
                  checked={!!settings[key]}
                  onChange={v => toggleSetting(key, v)}
                  disabled={!agentEnabled || saving === key}
                />
              </div>
            )
          })}
        </Card>
      </div>

      {/* WhatsApp */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <IconBrandWhatsapp size={16} className="text-green-600" />
          <h2 className="text-sm font-bold text-[#0f172a]">WhatsApp</h2>
        </div>
        <Card>
          {waKeys.map(key => {
            const info = NOTIF_LABELS[key]
            return (
              <div key={key} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#f5f5f0] last:border-0">
                <span className="text-base">{info.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#0f172a]">{info.label}</div>
                  <div className="text-xs text-[#888] mt-0.5">{info.desc}</div>
                </div>
                <Toggle
                  checked={!!settings[key]}
                  onChange={v => toggleSetting(key, v)}
                  disabled={saving === key}
                />
              </div>
            )
          })}
        </Card>
      </div>

      {/* Məlumat ehtiyatı */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <IconDownload size={16} className="text-[#0f172a]" />
          <h2 className="text-sm font-bold text-[#0f172a]">Məlumat ehtiyatı</h2>
        </div>
        <Card className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#0f172a]">JSON ixrac</div>
              <div className="text-xs text-[#888] mt-0.5">Bütün layihə, tapşırıq, maliyyə məlumatlarını yükləyin</div>
            </div>
            <Button variant="secondary" size="sm" onClick={exportData}>
              <IconDownload size={13} /> Yüklə
            </Button>
          </div>
        </Card>
      </div>

      {/* Sistem məlumatları */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IconSettings size={16} className="text-[#0f172a]" />
          <h2 className="text-sm font-bold text-[#0f172a]">Sistem məlumatları</h2>
        </div>
        <Card className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[#888] mb-1">Şirkət</div>
              <div className="font-medium text-[#0f172a]">Reflect Architects</div>
            </div>
            <div>
              <div className="text-[#888] mb-1">Ünvan</div>
              <div className="font-medium text-[#0f172a]">Bakı, Azərbaycan</div>
            </div>
            <div>
              <div className="text-[#888] mb-1">E-poçt</div>
              <div className="font-medium text-[#0f172a]">info@reflect.az</div>
            </div>
            <div>
              <div className="text-[#888] mb-1">Sistem versiyası</div>
              <div className="font-medium text-[#0f172a]">v1.0 · 2026</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
