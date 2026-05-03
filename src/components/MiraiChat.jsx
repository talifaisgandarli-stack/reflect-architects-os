import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { IconX, IconSend, IconChevronDown, IconSparkles } from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const PERSONAS = [
  { key: 'chief_architect', label: 'Chief Architect', icon: '🏛️', adminOnly: false },
  { key: 'cfo',  label: 'CFO',  icon: '💰', adminOnly: true },
  { key: 'coo',  label: 'COO',  icon: '⚙️', adminOnly: true },
  { key: 'hr',   label: 'HR',   icon: '👥', adminOnly: true },
  { key: 'cco',  label: 'CCO',  icon: '📧', adminOnly: true },
  { key: 'cmo',  label: 'CMO',  icon: '📈', adminOnly: true },
]

const PAGE_SUGGESTIONS = {
  '/maliyye-merkezi': ['Bu ayın P&L-i?', 'Forecast riskləri?', 'Cash status izah et'],
  '/tapshiriqlar':    ['Bloklanmış tapşırıqlar?', 'Deadline riski var?', 'Prioritet sırala'],
  '/musteriler':      ['Pipeline sağlamlığı?', 'Aktiv müştərilər?', 'İtirilmə tendensiyası?'],
  '/layiheler':       ['Aktiv layihə P&L?', 'Gecikən layihələr?', 'Resurs yükü?'],
  '/dashboard':       ['Bugünkü xülasə', 'Bu həftə nə var?', 'Kritik məsələlər?'],
}

const DEFAULT_SUGGESTIONS = ['Nə kömək edə bilərəm?', 'Aktual vəziyyət necədir?', 'Normativ sualım var']

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0 mt-0.5 mr-2 text-[10px]">
          ✦
        </div>
      )}
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#4F6BFB] text-white rounded-br-sm'
            : 'bg-[#f5f5f0] text-[#0f172a] rounded-bl-sm'
        }`}>
        {msg.content}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0 mt-0.5 mr-2 text-[10px]">
        ✦
      </div>
      <div className="bg-[#f5f5f0] rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-[#aaa] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MiraiChat() {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  const [open,      setOpen]      = useState(false)
  const [persona,   setPersona]   = useState('chief_architect')
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)
  const [usageInfo, setUsageInfo] = useState(null)

  const messagesEndRef  = useRef(null)
  const inputRef        = useRef(null)
  const personaMenuRef  = useRef(null)

  // Auto-select persona based on current page (admin only)
  useEffect(() => {
    if (!isAdmin) { setPersona('chief_architect'); return }
    const path = location.pathname
    if (path.includes('maliyye')) setPersona('cfo')
    else if (path.includes('tapshiriq')) setPersona('coo')
    else if (path.includes('musterilet') || path.includes('pipeline')) setPersona('cmo')
    else setPersona('chief_architect')
  }, [location.pathname, isAdmin])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Close persona menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target)) {
        setShowPersonaMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const currentPersona = PERSONAS.find(p => p.key === persona) || PERSONAS[0]
  const suggestions = PAGE_SUGGESTIONS[location.pathname] || DEFAULT_SUGGESTIONS

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token

      const historyForAPI = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/mirai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          message: trimmed,
          persona,
          page_context: location.pathname,
          history: historyForAPI,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Xəta baş verdi. Yenidən cəhd edin.',
        }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      if (data.usage) setUsageInfo(data.usage)

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Şəbəkə xətası. Bağlantını yoxlayın.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, persona, location.pathname])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setUsageInfo(null)
  }

  const showSuggestions = messages.length === 0 && !loading

  if (!user) return null

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-50 transition-all hover:scale-105 active:scale-95 ${open ? 'bg-[#0f172a]' : 'bg-[#4F6BFB]'}`}
        title="MIRAI AI">
        {open
          ? <IconX size={22} className="text-white" />
          : <span className="text-2xl select-none">{currentPersona.icon}</span>
        }
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-24 right-5 w-[360px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-[#e8e8e4] flex flex-col z-50 overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0ec] bg-[#fafaf8]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0f172a] flex items-center justify-center text-sm">
                {currentPersona.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-[#0f172a]">MIRAI</span>
                <span className="text-[10px] text-[#aaa] ml-1.5">{currentPersona.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Persona selector (admin only) */}
              {isAdmin && (
                <div className="relative" ref={personaMenuRef}>
                  <button
                    onClick={() => setShowPersonaMenu(v => !v)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#555] border border-[#e8e8e4] rounded-lg hover:bg-[#f5f5f0] transition-colors">
                    {currentPersona.label}
                    <IconChevronDown size={10} />
                  </button>
                  {showPersonaMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e4] rounded-xl shadow-lg py-1 min-w-[140px] z-10">
                      {PERSONAS.filter(p => !p.adminOnly || isAdmin).map(p => (
                        <button key={p.key}
                          onClick={() => { setPersona(p.key); setShowPersonaMenu(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#f5f5f0] transition-colors text-left ${persona === p.key ? 'font-bold text-[#4F6BFB]' : 'text-[#555]'}`}>
                          <span>{p.icon}</span>{p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.length > 0 && (
                <button onClick={clearChat}
                  className="text-[9px] text-[#bbb] hover:text-[#555] px-1.5 py-1 rounded transition-colors">
                  Təmizlə
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
            {/* Welcome / suggestions */}
            {showSuggestions && (
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">{currentPersona.icon}</div>
                <p className="text-xs font-semibold text-[#0f172a]">MIRAI {currentPersona.label}</p>
                <p className="text-[10px] text-[#aaa] mt-0.5 mb-3">Sualınızı yazın və ya seçin</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-[10px] px-2.5 py-1.5 bg-[#f5f5f0] hover:bg-[#e8e8e4] text-[#555] rounded-full transition-colors border border-[#e8e8e4]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Usage indicator */}
          {usageInfo && (
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[9px] text-[#ddd]">
                ${(usageInfo.monthly_spend||0).toFixed(3)} / ${usageInfo.monthly_budget} bu ay
              </span>
              <div className="flex-1 mx-2 bg-[#f5f5f0] rounded-full h-0.5 overflow-hidden">
                <div className="h-full bg-[#4F6BFB] rounded-full"
                  style={{ width: `${Math.min(100, ((usageInfo.monthly_spend||0)/usageInfo.monthly_budget)*100)}%` }} />
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-3 pb-3 pt-1 border-t border-[#f0f0ec]">
            <div className="flex items-end gap-2 bg-[#f5f5f0] rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sual yazın..."
                rows={1}
                className="flex-1 bg-transparent text-xs text-[#0f172a] placeholder-[#bbb] resize-none outline-none min-h-[20px] max-h-[80px]"
                style={{ lineHeight: '1.4' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-[#4F6BFB] flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#3b5de0] transition-colors">
                <IconSend size={13} className="text-white" />
              </button>
            </div>
            <p className="text-[9px] text-[#ddd] text-center mt-1.5">
              {isAdmin ? 'Admin · ' : ''}{currentPersona.label} · Enter ilə göndər
            </p>
          </div>
        </div>
      )}
    </>
  )
}
