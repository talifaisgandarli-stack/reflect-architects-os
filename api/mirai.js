import { createClient } from '@supabase/supabase-js'

// ─── Clients ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_API_URL  = 'https://api.anthropic.com/v1/messages'
const HAIKU_MODEL        = 'claude-haiku-4-5-20251001'
const MONTHLY_BUDGET_USD = parseFloat(process.env.MIRAI_MONTHLY_BUDGET_USD || '5')

// Rate limits per role
const DAILY_LIMITS = { admin: 100, user: 30 }

// ─── Persona system prompts ───────────────────────────────────────────────────
const PERSONA_PROMPTS = {
  cfo: `Sən MIRAI CFO-sun — Reflect Architects OS-un baş maliyyə analitikisin.
Rolu: Cash flow analizi, P&L hesablaması, forecast, büdcə qərarları.
Qaydalar:
- Hər maliyyə cavabında riyazi dəqiqlik məcburidir (hesablamaları göstər)
- Hər cavabın sonuna əlavə et: "⚠️ Bu məlumatlar yalnız analitik məqsəd daşıyır."
- AZ manat (₼) ilə işlə
- Proqnozlarda uncertainty açıq qeyd et ("Varsayım: ..., Risk: ...")
- Qısa cavab ver — maksimum 3-4 cümlə + rəqəmlər
Dil: Azərbaycanca (peşəkar, rəsmi)`,

  hr: `Sən MIRAI HR direktorsun — komanda, performans, kadr məsələlərinin ekspertisin.
Rolu: Performans analizi, məzuniyyət planlaması, işçi yükü, motivasiya.
Qaydalar:
- İşçilərin şəxsi məlumatlarına hörmətlə yanaş
- Performans tövsiyələri konstruktiv olsun
- Əmək Məcəlləsinə uyğun cavablar ver (AZ qanunu)
- Konkret addımlar təklif et
Dil: Azərbaycanca (dostane, dəstəkləyici)`,

  coo: `Sən MIRAI COO-sun — əməliyyat menecmentinin ekspertisin.
Rolu: Tapşırıq tıxanmaları, deadline riski, resurs paylaşımı, proses optimizasiyası.
Qaydalar:
- Real-time data-ya əsaslan
- Prioritet məsələləri birinci göstər (🔴 kritik → 🟡 diqqət → 🟢 normal)
- Konkret həll yolları təklif et (nə etməli, kim, nə vaxt)
- Gereksiz detallardan qaçın
Dil: Azərbaycanca (birbaşa, fəal)`,

  cco: `Sən MIRAI CCO-sun — müştəri kommunikasiyasının ekspertisin.
Rolu: E-poçt layihəsi, müştəri cavabları, şikayət idarəetməsi, tone calibration.
Qaydalar:
- Azərbaycan iş mühitinin peşəkar tonunu qoru
- Hazır e-poçt şablonları ver (başlıq + məzmun + imza)
- Mürəkkəb situasiyalarda eskalasiya tövsiyəsi ver
- Müştəri perspektivindən düşün
Dil: Azərbaycanca (peşəkar, isti)`,

  cmo: `Sən MIRAI CMO-sun — marketinq və biznes inkişafının ekspertisin.
Rolu: Portfolio strategiyası, müştəri analizi, award nominasiyaları, brand positioning.
Qaydalar:
- Memarlıq sektoru spesifik məsləhətlər ver
- Pipeline məlumatlarına əsaslan
- Konkret aksiyon planları hazırla
- AZ + beynəlxalq bazar fərqini nəzərə al
Dil: Azərbaycanca (strateji, aydın)`,

  chief_architect: `Sən MIRAI Chief Architect-sən — Azərbaycan memarlıq sektorunun 30+ il təcrübəli ekspertisin.
Rolu: Tikinti normativləri, standartlar, icazə prosedurları, sahə məsləhəti.
Bilik bazası:
- SNiP seriyası (2.08.01-89, 2.07.01-89 və s.)
- AZS EN seriyası (Eurocode uyğunlaşması)
- Yanğın təhlükəsizliyi normaları (AZ)
- Əlillik (accessibility) tələbləri
- Enerji səmərəliliyi standartları
- Bakı-spesifik qaydalar (şəhərsalma, texniki baxış)
- Ekspertiza prosedurları
Qaydalar:
- Normativ istinadları dəqiq ver (maddə nömrəsi ilə)
- "Əmin deyiləm" demə — "Bu barədə peşəkar mühəndislə məsləhətləş" de
- Mali məlumat vermə (sənin ixtisasın deyil)
- Global standartları AZ reallığı ilə müqayisə et
Dil: Azərbaycanca (ekspert, aydın)`,
}

// ─── Context suggestion chips by page ─────────────────────────────────────────
export const PAGE_SUGGESTIONS = {
  '/maliyye-merkezi': ['Bu ayın P&L-i?', 'Forecast riskləri?', 'Cash status izah et'],
  '/tapshiriqlar':    ['Bu həftə nə bloklanıb?', 'Deadline riski var?', 'Prioritet sırala'],
  '/musteriler':      ['Pipeline sağlamlığı?', 'İtirilmə tendensiyası?', 'Yeni müştəri analizi'],
  '/layiheler':       ['Aktiv layihə P&L-i?', 'Gecikən layihələr?', 'Resurs yükü?'],
  '/dashboard':       ['Bugünkü xülasə', 'Bu həftə nə var?', 'Kritik məsələlər?'],
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
const ADMIN_TOOLS = [
  {
    name: 'query_financials',
    description: 'Cash balans, P&L, gəlir/xərc məlumatı. Yalnız son 3 ay.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['current_month', 'last_3_months', 'this_year'], description: 'Zaman dövrü' },
      },
      required: ['period'],
    },
  },
  {
    name: 'query_team',
    description: 'Komanda üzvlərinin aktiv tapşırıq sayı, gecikmiş tapşırıqlar.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
]

const SHARED_TOOLS = [
  {
    name: 'query_tasks',
    description: 'Aktiv tapşırıqların statusu, deadline riski, bloklanmış tapşırıqlar.',
    input_schema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'overdue', 'blocked', 'my'], description: 'Filtir növü' },
      },
      required: ['filter'],
    },
  },
  {
    name: 'query_clients',
    description: 'Müştəri pipeline statusu, aktiv müzakirələr.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
]

// ─── Tool executors ───────────────────────────────────────────────────────────
async function executeTool(toolName, toolInput, userId) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()

  if (toolName === 'query_financials') {
    const since = toolInput.period === 'this_year'
      ? `${now.getFullYear()}-01-01`
      : toolInput.period === 'last_3_months' ? threeMonthsAgo.slice(0,10)
      : monthStart.slice(0,10)

    const [{ data: incomes }, { data: expenses }] = await Promise.all([
      supabase.from('incomes').select('amount,payment_date,payment_method').gte('payment_date', since),
      supabase.from('expenses').select('amount,expense_date,category').gte('expense_date', since),
    ])
    const totalIncome  = (incomes||[]).reduce((s,i)=>s+Number(i.amount||0),0)
    const totalExpense = (expenses||[]).reduce((s,e)=>s+Number(e.amount||0),0)
    const byCategory   = {}
    ;(expenses||[]).forEach(e => { byCategory[e.category||'digər'] = (byCategory[e.category||'digər']||0) + Number(e.amount||0) })
    return {
      period: toolInput.period,
      total_income: totalIncome,
      total_expense: totalExpense,
      net: totalIncome - totalExpense,
      margin_pct: totalIncome > 0 ? ((totalIncome-totalExpense)/totalIncome*100).toFixed(1) : 0,
      expense_by_category: byCategory,
      transfer_income: (incomes||[]).filter(i=>i.payment_method==='transfer').reduce((s,i)=>s+Number(i.amount||0),0),
      cash_income: (incomes||[]).filter(i=>i.payment_method==='cash').reduce((s,i)=>s+Number(i.amount||0),0),
    }
  }

  if (toolName === 'query_tasks') {
    let query = supabase.from('tasks')
      .select('id,title,status,due_date,priority,assignee_ids,project_id')
      .eq('archived', false)
      .not('status', 'in', '("Tamamlandı","Cancelled")')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20)

    if (toolInput.filter === 'overdue') {
      query = query.lt('due_date', now.toISOString().slice(0,10))
    } else if (toolInput.filter === 'my') {
      query = query.contains('assignee_ids', [userId])
    }

    const { data: tasks } = await query
    const today = now.toISOString().slice(0,10)
    return {
      total: (tasks||[]).length,
      tasks: (tasks||[]).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        due: t.due_date,
        days_left: t.due_date ? Math.floor((new Date(t.due_date)-now)/86400000) : null,
        overdue: t.due_date ? t.due_date < today : false,
      }))
    }
  }

  if (toolName === 'query_clients') {
    const { data: clients } = await supabase
      .from('clients')
      .select('name,pipeline_stage,status,expected_value')
      .not('pipeline_stage', 'in', '("Bitib","Arxiv","İtirildi")')
      .order('created_at', { ascending: false })
      .limit(15)

    const CONF = { 'Lead':0.1,'Təklif':0.3,'Müzakirə':0.5,'İmzalanıb':0.75,'İcrada':0.95 }
    const list = (clients||[]).map(c => ({
      name: c.name,
      stage: c.pipeline_stage || c.status,
      expected_value: c.expected_value,
      weighted: c.expected_value ? (c.expected_value * (CONF[c.pipeline_stage||c.status]||0.1)) : 0,
    }))
    return {
      total: list.length,
      weighted_pipeline: list.reduce((s,c)=>s+c.weighted,0),
      clients: list,
    }
  }

  if (toolName === 'query_team') {
    const { data: members } = await supabase
      .from('profiles')
      .select('id,full_name')
      .eq('is_active', true)
      .limit(20)

    const results = await Promise.all((members||[]).map(async m => {
      const { count: active } = await supabase.from('tasks')
        .select('id', { count: 'exact', head: true })
        .contains('assignee_ids', [m.id])
        .not('status', 'in', '("Tamamlandı","Cancelled")')
        .eq('archived', false)

      const { count: overdue } = await supabase.from('tasks')
        .select('id', { count: 'exact', head: true })
        .contains('assignee_ids', [m.id])
        .lt('due_date', now.toISOString().slice(0,10))
        .not('status', 'in', '("Tamamlandı","Cancelled")')
        .eq('archived', false)

      return { name: m.full_name, active_tasks: active||0, overdue_tasks: overdue||0 }
    }))
    return { team: results }
  }

  return { error: 'Unknown tool' }
}

// ─── Cost & rate limit helpers ────────────────────────────────────────────────
async function checkRateLimit(userId, isAdmin) {
  const today = new Date().toISOString().slice(0,10)
  const limit = isAdmin ? DAILY_LIMITS.admin : DAILY_LIMITS.user

  const { data } = await supabase.from('mirai_usage')
    .select('request_count,cost_usd')
    .eq('user_id', userId).eq('date', today).single()

  if (data && data.request_count >= limit) {
    return { allowed: false, reason: `Günlük limit (${limit} sorğu) dolub.` }
  }
  return { allowed: true, todayUsage: data }
}

async function getMonthlySpend() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0,0,0,0)

  const { data } = await supabase.from('mirai_usage')
    .select('cost_usd')
    .gte('date', monthStart.toISOString().slice(0,10))

  return (data||[]).reduce((s,r)=>s+Number(r.cost_usd||0),0)
}

async function recordUsage(userId, tokensIn, tokensOut, costUsd) {
  const today = new Date().toISOString().slice(0,10)
  await supabase.from('mirai_usage').upsert({
    user_id: userId, date: today,
    request_count: 1,
    token_input_total: tokensIn,
    token_output_total: tokensOut,
    cost_usd: costUsd,
  }, {
    onConflict: 'user_id,date',
    ignoreDuplicates: false,
  })
  // Manual increment since upsert replaces
  await supabase.rpc('increment_mirai_usage', {
    p_user_id: userId, p_date: today,
    p_requests: 1, p_input: tokensIn, p_output: tokensOut, p_cost: costUsd,
  }).maybeSingle()
}

// Calculate cost for Haiku 4.5: $0.25/1M input, $1.25/1M output
function calcCost(inputTokens, outputTokens, cachedInputTokens = 0) {
  const normalInput = (inputTokens - cachedInputTokens) / 1_000_000 * 0.25
  const cachedCost  = cachedInputTokens / 1_000_000 * 0.03   // cache read price
  const outputCost  = outputTokens / 1_000_000 * 1.25
  return normalInput + cachedCost + outputCost
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  // ── Auth ──
  const authHeader = req.headers.authorization || ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' })

  // Get profile + role
  const { data: profile } = await supabase.from('profiles')
    .select('full_name,is_creator')
    .eq('id', user.id).single()
  const { data: roleData } = await supabase.from('profiles')
    .select('roles(level)')
    .eq('id', user.id).single()
  const roleLevel = roleData?.roles?.level ?? 99
  const isAdmin = profile?.is_creator === true || roleLevel <= 2

  const { message, persona: requestedPersona, page_context, history = [] } = req.body

  if (!message?.trim()) return res.status(400).json({ error: 'Message required' })

  // ── Privacy filter: user always gets chief_architect ──
  const persona = isAdmin ? (requestedPersona || 'chief_architect') : 'chief_architect'

  // ── Rate limit ──
  const { allowed, reason } = await checkRateLimit(user.id, isAdmin)
  if (!allowed) return res.status(429).json({ error: reason })

  // ── Monthly budget check ──
  const monthlySpend = await getMonthlySpend()
  const useGroqFallback = monthlySpend >= MONTHLY_BUDGET_USD

  if (monthlySpend >= MONTHLY_BUDGET_USD * 0.9 && monthlySpend < MONTHLY_BUDGET_USD) {
    // Warning zone — continue but log
    console.warn(`MIRAI budget warning: $${monthlySpend.toFixed(3)} / $${MONTHLY_BUDGET_USD}`)
  }

  // ── Build context injection ──
  const pageLabel = page_context || '/'
  const contextBlock = `\n\n[CONTEXT]\nSəhifə: ${pageLabel}\nİstifadəçi: ${profile?.full_name || 'İstifadəçi'} (${isAdmin ? 'Admin' : 'İşçi'})\nPersona: ${persona.toUpperCase()}\nZaman: ${new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}`

  const systemPrompt = (PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.chief_architect) + contextBlock

  // ── Build tools list ──
  const tools = persona === 'chief_architect' && !isAdmin
    ? SHARED_TOOLS
    : isAdmin ? [...SHARED_TOOLS, ...ADMIN_TOOLS] : SHARED_TOOLS

  // ── Build messages array ──
  // Keep last 8 messages for context (compression strategy)
  const trimmedHistory = history.slice(-8)
  const messages = [
    ...trimmedHistory,
    { role: 'user', content: message },
  ]

  // ── Call Claude Haiku 4.5 (with prompt caching) ──
  let finalResponse = ''
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let cachedTokens = 0

  try {
    const callClaude = async (msgs, includeTools) => {
      const body = {
        model: HAIKU_MODEL,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }, // Cache system prompt
          },
        ],
        messages: msgs,
      }
      if (includeTools && tools.length > 0) {
        body.tools = tools
        body.tool_choice = { type: 'auto' }
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Anthropic API error ${response.status}: ${err}`)
      }
      return response.json()
    }

    // First call
    let result = await callClaude(messages, true)
    totalInputTokens  += result.usage?.input_tokens || 0
    totalOutputTokens += result.usage?.output_tokens || 0
    cachedTokens       += result.usage?.cache_read_input_tokens || 0

    // Handle tool use (agentic loop — max 3 iterations)
    let iterations = 0
    let currentMessages = [...messages]

    while (result.stop_reason === 'tool_use' && iterations < 3) {
      iterations++
      const toolUseBlocks = result.content.filter(b => b.type === 'tool_use')

      // Execute all tools in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async tb => {
          // Privacy guard: block financial tools for non-admin
          if (!isAdmin && ['query_financials','query_team'].includes(tb.name)) {
            return {
              type: 'tool_result',
              tool_use_id: tb.id,
              content: 'Bu məlumat sizin səlahiyyətiniz daxilində deyil.',
            }
          }
          const result = await executeTool(tb.name, tb.input, user.id)
          return {
            type: 'tool_result',
            tool_use_id: tb.id,
            content: JSON.stringify(result),
          }
        })
      )

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: result.content },
        { role: 'user', content: toolResults },
      ]

      result = await callClaude(currentMessages, false)
      totalInputTokens  += result.usage?.input_tokens || 0
      totalOutputTokens += result.usage?.output_tokens || 0
      cachedTokens       += result.usage?.cache_read_input_tokens || 0
    }

    // Extract text response
    finalResponse = result.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()

  } catch (err) {
    console.error('MIRAI Claude error:', err.message)

    // Groq fallback (free tier)
    if (process.env.GROQ_API_KEY || useGroqFallback) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            max_tokens: 800,
          }),
        })
        if (groqRes.ok) {
          const groqData = await groqRes.json()
          finalResponse = groqData.choices?.[0]?.message?.content || 'Xəta baş verdi.'
        }
      } catch (groqErr) {
        console.error('Groq fallback error:', groqErr.message)
      }
    }

    if (!finalResponse) {
      return res.status(500).json({ error: 'AI servisi əlçatmazdır. Sonra yenidən cəhd edin.' })
    }
  }

  // ── Record usage ──
  const costUsd = calcCost(totalInputTokens, totalOutputTokens, cachedTokens)
  try {
    const today = new Date().toISOString().slice(0,10)
    const { data: existing } = await supabase.from('mirai_usage')
      .select('request_count,token_input_total,token_output_total,cost_usd')
      .eq('user_id', user.id).eq('date', today).single()

    await supabase.from('mirai_usage').upsert({
      user_id: user.id,
      date: today,
      request_count:      (existing?.request_count      || 0) + 1,
      token_input_total:  (existing?.token_input_total  || 0) + totalInputTokens,
      token_output_total: (existing?.token_output_total || 0) + totalOutputTokens,
      cost_usd:           (existing?.cost_usd           || 0) + costUsd,
    }, { onConflict: 'user_id,date' })
  } catch (e) {
    console.error('Usage record error:', e.message)
  }

  return res.status(200).json({
    response: finalResponse,
    persona,
    usage: {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cached_tokens: cachedTokens,
      cost_usd: costUsd,
      monthly_spend: monthlySpend + costUsd,
      monthly_budget: MONTHLY_BUDGET_USD,
    },
  })
}
