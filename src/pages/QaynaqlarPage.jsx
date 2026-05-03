import { useState, useRef, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button } from '../components/ui'
import { IconSend, IconRobot, IconUser, IconTrash, IconBook } from '@tabler/icons-react'

const SYSTEM_PROMPT = `Sən Reflect Architects memarlıq şirkətinin xüsusi AI məsləhətçisisən. Azərbaycanda fəaliyyət göstərən peşəkar memarlıq şirkəti üçün işləyirsən.

Sənin rolun:
- Memarlıq, tikinti, layihələndirmə suallarına cavab vermək
- Azərbaycan qanunvericiliyinə əsasən hüquqi məsləhət vermək
- Smeta, büdcə, tikinti xərcləri barədə məlumat vermək
- İcazə, razılaşma prosedurları barədə izahat vermək
- Peşəkar tikinti standartları (AZS, SNiP, SP) barədə məlumat vermək

MÜTLƏQ QAYDA: Hər cavabın sonunda "📚 İstinadlar:" bölməsini əlavə et. Burada hansı normativ sənədə, qanuna, standarta istinad etdiyini qeyd et. Məsələn:
- Azərbaycan Respublikasının "Şəhərsalma və tikinti haqqında" Qanunu
- SNiP 2.08.01-89 "Yaşayış binaları"
- AZS EN 1990:2011 Eurocode - Konstruksiyaların layihələndirilməsinin əsasları
- AR Nazirlər Kabinetinin XX.XX.XXXX tarixli XX nömrəli Qərarı

Cavabların:
- Azərbaycan dilində olsun
- Peşəkar, dəqiq və praktiki olsun
- Azərbaycan reallığına uyğun olsun (Bakı, regional xüsusiyyətlər)
- Lazım olduqda addım-addım izah et
- Qiymət məlumatı veriləndə AZN ilə göstər

Sahələrin: memarlıq layihələndirməsi, tikinti texnologiyası, smeta işi, hüquqi prosedurlar, icazələr, standartlar, materiallar, podrat münasibətləri.`

const SUGGESTIONS = [
  'Yaşayış binası üçün hansı icazələr lazımdır?',
  'Tikinti smetası necə hazırlanır?',
  'Yanğın təhlükəsizliyi normaları nələrdir?',
  'Memarın lisenziyası üçün nə lazımdır?',
  'EQT (Ekoloji Qiymətləndirmə) nə vaxt tələb olunur?',
  'Podrat müqaviləsində nələr olmalıdır?',
  'Mərtəbə hündürlüyü normativləri nədir?',
  'Accessibility (əlil) tələbləri nələrdir?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-[#0f172a]' : 'bg-blue-100'}`}>
        {isUser
          ? <IconUser size={14} className="text-white" />
          : <IconRobot size={14} className="text-blue-600" />
        }
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#0f172a] text-white rounded-tr-sm'
            : 'bg-[#f5f5f0] text-[#0f172a] rounded-tl-sm border border-[#e8e8e4]'
        }`}>
          {msg.content}
        </div>
        <div className="text-[10px] text-[#aaa] mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default function QaynaqlarPage() {
  const { addToast } = useToast()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Salam! Mən Reflect Architects-in AI Məsləhətçisiyəm. 🏛️\n\nAzərbaycan qanunvericiliyinə, tikinti normativlərinə, smeta işinə, icazə prosedurlarına dair istənilən sualınıza cavab verə bilərəm.\n\nHər cavabımda hansı normativ sənədə istinad etdiyimi göstərirəm.',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userMsg, timestamp: Date.now() }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: newMessages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await res.json()

      if (data.error) {
        addToast('AI cavab vermədi: ' + (data.error.message || 'naməlum xəta'), 'error')
      } else {
        const reply = data.content?.[0]?.text || 'Xəta baş verdi.'
        setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }])
      }
    } catch (err) {
      addToast('Şəbəkə xətası: ' + err.message, 'error')
    }
    setLoading(false)
  }

  function clearChat() {
    setMessages([{
      role: 'assistant',
      content: 'Söhbət təmizləndi. Yeni sual verə bilərsiniz.',
      timestamp: Date.now()
    }])
  }

  return (
    <div className="p-4 lg:p-6 fade-in" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <IconBook size={20} className="text-blue-600" />
            Qaynaqlar — AI Məsləhətçi
          </h1>
          <p className="text-xs text-[#888] mt-0.5">Azərbaycan qanunvericiliyinə əsasən memarlıq, tikinti, smeta məsləhəti</p>
        </div>
        <Button variant="secondary" size="sm" onClick={clearChat}>
          <IconTrash size={13} /> Təmizlə
        </Button>
      </div>

      {/* Sürətli suallar */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-[#888] mb-2">Tez-tez verilən suallar:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 border border-[#e8e8e4] rounded-full hover:border-[#0f172a] hover:bg-[#f5f5f0] transition-colors text-[#555]">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mesajlar */}
      <Card className="flex-1 overflow-y-auto p-4 mb-3" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <IconRobot size={14} className="text-blue-600" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#f5f5f0] border border-[#e8e8e4]">
              <div className="flex gap-1 items-center h-5">
                <div className="w-1.5 h-1.5 bg-[#aaa] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#aaa] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#aaa] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Sualınızı yazın... (məs: Yaşayış binası üçün hansı icazələr lazımdır?)"
          className="flex-1 px-4 py-2.5 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a] bg-white"
          disabled={loading}
        />
        <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="px-4">
          <IconSend size={15} />
        </Button>
      </div>
    </div>
  )
}
