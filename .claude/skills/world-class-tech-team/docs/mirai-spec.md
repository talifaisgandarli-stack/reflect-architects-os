# 🤖 MIRAI — CHIEF AI OFFICER MASTER SPEC

> **Status:** Approved (2026-05-03)
> **Stage:** Pre-PMF → Scaling
> **Constraint:** Pulsuz/ucuz + maksimum avtomatlaşdırma
> **Goal:** 6 C-suite rolu əvəz edəcək AI sistemi — hallüsinasiya yox, kontekst var

---

## 🏛️ ARXİTEKTURA

```
┌─────────────────────────────────────────────────┐
│  🤖 MIRAI Pop-up (sağ-aşağı, hər səhifədə)     │
└─────────────────────────────────────────────────┘
         │
         ├── Persona Router (hansı C-suite lazım?)
         │       ├── CFO — maliyyə            [admin]
         │       ├── HR — kadr/performans     [admin]
         │       ├── COO — əməliyyat          [admin]
         │       ├── CCO — kommunikasiya      [admin]
         │       ├── CMO — marketinq          [admin]
         │       └── Chief Architect — sahə   [admin + user]
         │
         ├── Context Engine (səhifə + entity-aware)
         ├── Privacy Filter (user → mali blok)
         ├── RAG Engine (AZ normativlər + qanunlar)
         ├── Tool Layer (SQL, PDF, Telegram, forecast read)
         └── Cost Guard (rate limit + budget cap + fallback)
```

---

## 1️⃣ PERSONA-LAR

### Admin persona-ları (6 rəqəm)

| Persona | Rolu | Xüsusiyyət |
|---|---|---|
| **CFO** | Maliyyə analizi, forecast, cash flow, P&L | Riyazi dəqiqlik məcburi, hər cavabda disclaimer |
| **HR** | Kadr, performans, 360° survey, məzuniyyət | İşçi məlumatlarına tam çıxış |
| **COO** | Əməliyyat, tapşırıq tıxanmaları, deadline riski | Real-time tasks DB oxuyur |
| **CCO** | Müştəri kommunikasiyası, e-poçt layihə, şikayət | Tone calibration: AZ peşəkar |
| **CMO** | Marketinq strategiyası, portfolio, müştəri analizi | Pipeline məlumatlarına çıxış |
| **Chief Architect** | Memarlıq, tikinti, normativlər, standartlar | RAG: AZ 30+ il + global |

### User persona (1 rəqəm)
- Yalnız **Chief Architect** açıqdır
- Seçim: 🇦🇿 Azərbaycan təcrübəsi / 🌍 Global
- Mali məlumat görünmür (Privacy Filter)
- Rate limit: 30 sual/gün

### Persona auto-routing (admin üçün)
Sistem aktiv səhifəyə + sual mövzusuna görə persona avtomatik seçir:

```
Maliyyə Mərkəzi + "cash flow" → CFO
Tapşırıqlar + "deadline risk" → COO  
Müştəri + "e-poçt yaz" → CCO
Pipeline + "forecast" → CFO
İşçi + "performans" → HR
Normativ sual → Chief Architect
```

Admin istəsə manual override edə bilər.

---

## 2️⃣ CONTEXT ENGINE — Səhifə-Aware

MIRAI hər mesajda bilirsə:
- Hansı səhifədə olduğunu (`page_context`)
- Hansı entity-nin üzərindədir (layihə ID, müştəri ID, tapşırıq ID)
- Cari istifadəçinin rolu (admin / user)
- Cari saatın maliyyə snapshot-u (CFO üçün)

### Context injection (system prompt-a avtomatik)
```
[CONTEXT]
Page: /projects/abc123
Entity: Layihə "Nəriman Towers" (status: icrada, P&L: ₼57K net)
User: Admin (Talifa İsgəndərli)
Time: 2026-05-03 14:30
Cash: Bank ₼145K | Kassa ₼8.5K
Active deadlines: 2 (3 gün + 12 gün)
```

Bu context **cached** (prompt caching ilə 90% ucuz).

---

## 3️⃣ RAG ENGINE — Azərbaycan Bilik Bazası

### Bilik bazası məzmunu

**AZ Qanunlar (prioritet)**
- "Şəhərsalma və tikinti haqqında" Qanun (son redaksiya)
- "Sahibkarlıq fəaliyyəti haqqında" Qanun
- "Mühasibat uçotu haqqında" Qanun
- Vergi Məcəlləsi (VAT, gəlir vergisi, ödəniş müddətləri)
- Əmək Məcəlləsi (məzuniyyət, işdən çıxarma, maaş)
- "Elektron imza haqqında" Qanun

**Tikinti Normativləri**
- SNiP seriyası (2.08.01-89, 2.07.01-89 və s.)
- AZS EN seriyası (Eurocode uyğunlaşması)
- Yanğın təhlükəsizliyi normaları
- Accessibility (əlillik) tələbləri
- Enerji səmərəliliyi standartları

**Azərbaycan Reallığı (30+ il)**
- İcazə prosedurları (şəhər/rayon fərqi)
- Bakı-spesifik qaydalar (Binaların Texniki Baxışı)
- Podrat bazar qiymətləri (AZN, 2024-2026)
- Smeta normativləri (ABŞERON+)

### RAG texniki arxitektura
```sql
create table mirai_knowledge (
  id uuid primary key,
  source_type text,          -- law | normative | practice | case
  source_name text,
  content text,
  embedding vector(1536),    -- pgvector
  locale text default 'az',  -- az | global
  valid_from date,
  valid_until date,          -- NULL = hələ də qüvvədədir
  tags text[],
  created_at timestamptz default now()
);

create index on mirai_knowledge using ivfflat (embedding vector_cosine_ops);
```

### RAG query flow
```
User sual → embed (text-embedding-3-small, $0.02/1M)
         → cosine similarity top-5 chunks
         → inject into system prompt as [REFERENCES]
         → Claude cavab verir + istinadları qeyd edir
```

**Xərc:** ~$0.002/sual (embedding) + model token xərci. Cəmi negligible.

---

## 4️⃣ TOOL LAYER — MIRAI-nin əlləri

MIRAI yalnız oxuya bilər (write yalnız explicit approve ilə):

### Read tools
```javascript
tools: [
  {
    name: "query_financials",
    description: "Cash balans, P&L, forecast məlumatı",
    // Admin only — user-da bu tool yoxdur
  },
  {
    name: "query_tasks", 
    description: "Tapşırıqların statusu, deadline riski",
  },
  {
    name: "query_clients",
    description: "Müştəri məlumatı, pipeline statusu",
  },
  {
    name: "query_team",
    description: "İşçilərin yükü, məzuniyyət, performans",
    // Admin only
  },
  {
    name: "search_knowledge",
    description: "RAG: AZ qanun + normativ axtarışı",
  },
  {
    name: "analyze_document",
    description: "Yüklənmiş PDF/sənədi analiz et",
  }
]
```

### Write tools (hər biri explicit user approve tələb edir)
```javascript
{
  name: "send_telegram",
  description: "Telegram mesaj göndər (komanda üzvünə)",
  // "Göndərilsin?" confirmation modal
},
{
  name: "create_task",
  description: "Tapşırıq yarat",
  // Preview → Approve flow
},
{
  name: "draft_email",
  description: "E-poçt layihəsi hazırla (göndərmir, draft edir)",
}
```

---

## 5️⃣ PRİVACY FİLTER

### User → Mali blok
İşçi (user) MIRAI-dən maliyyə sualı soruşanda:

```
User: "Şirkətin balansı neçədir?"

MIRAI (Chief Architect persona):
"Bu sual mənim ixtisasım daxilindədir, amma 
cavab vermək imkanım yoxdur. 🏛️

Memarlıq, tikinti normativləri, standartlar
barədə hər şeyi soruşa bilərsiniz."
```

Blok edilən mövzular (user üçün):
- Maliyyə balansı, P&L, gəlir/xərc
- Digər işçilərin maaşı, performansı  
- Müştəri ödəniş məlumatları
- Pipeline dəyərləri

### Admin-dan gizli olan yoxdur
Admin bütün 6 persona-ya çıxışı var + tam DB oxuma.

---

## 6️⃣ TELEGRAM İNTEQRASİYASI

### Mövcud sistem vs MIRAI

| Aspekt | Mövcud | MIRAI |
|---|---|---|
| Mesaj keyfiyyəti | Şablon, quru | Kontekstli, peşəkar |
| Dil | Mixed | Tam Azərbaycanca |
| Zənginlik | Text only | Strukturlu, prioritet |
| Trigger | Manual/cron | Smart (risk-based) |

### MIRAI-nin Telegram davranışı

**Proaktiv xəbərdarlıqlar (gündəlik 09:00):**
```
🏛️ MIRAI Günlük Xülasə — 3 May

📋 Bugün 2 deadline:
• Nəriman Towers: ekspertiza sənədləri (3 gün qaldı) ⚠️
• Botanika Ofis: ödəniş gözlənilir (₼25,000)

💰 Cash status: Cəmi ₼153,500
⚠️ 90-gün forecast: ₼165K (min. tələb ₼210K altında)

📌 1 kritik tapşırıq bloklanıb: [Nəriman — Fasad] cavab gözlənilir
```

**Trigger-based xəbərdarlıqlar:**
- Layihə deadline-ına 7 gün qalanda
- Cash balans min. tələbin 80%-nə düşəndə
- Tapşırıq 3 gündən artıq blokda qalanda
- Müştəridən cavab 5 gündən artıq gəlməyəndə
- Outsource "done" → "paid" keçidini unutanda (2 gün sonra)

### Telegram DB schema
```sql
create table telegram_notifications (
  id uuid primary key,
  recipient_user_id uuid references profiles(id),
  telegram_chat_id text,
  message_text text,
  trigger_type text,        -- proactive | deadline | cash | blocked
  entity_type text,         -- project | task | client | finance
  entity_id uuid,
  sent_at timestamptz,
  read_at timestamptz,
  mirai_generated boolean default true
);
```

---

## 7️⃣ PERFORMANS TRACKİNG

### Admin üçün (aylıq, real-time)
MIRAI HR persona avtomatik hesablayır:

```
📊 Aprel 2026 — Komanda Performansı

Aydan Məmmədova (Senior Memar)
• Tamamlanan tapşırıqlar: 23/26 (88%)
• Orta completion time: 2.3 gün (hədəf: 2.5 gün) ✅
• Bloklanan tapşırıqlar: 2 (texniki səbəb)
• Layihə payı (timesheet): 340 saat

Nurlan Həsənov (Junior Memar)  
• Tamamlanan: 15/19 (79%)
• Orta time: 3.1 gün (hədəf: 3.0 gün) ⚠️
• Qeyd: CAD öyrənmə mərhələsindədir
```

**MIRAI HR tövsiyəsi (admin-a görünür):**
```
💡 Nurlan üçün tövsiyə:
CAD tapşırıqlarında 0.5 gün artıq vaxt norması
təyin edin. Cari nəticəsi öyrənmə kurunu nəzərə
alaraq normaldır. 6 ay sonra yenidən qiymətləndirin.
```

### İşçi üçün (yalnız il sonu)
- Admin manual göndərir (export → PDF → Telegram/email)
- İşçi öz balını görür, başqasınını görmür
- 360° survey məlumatı: anonim, ancaq HR persona oxuyur

### 360° Survey schema
```sql
create table performance_surveys (
  id uuid primary key,
  survey_year int,
  subject_user_id uuid references profiles(id),
  reviewer_user_id uuid references profiles(id),  -- NULL = anonim
  scores jsonb,  -- {teamwork: 4, quality: 5, deadline: 3, ...}
  comment text,
  manager_review text,
  final_score numeric,
  created_at timestamptz
);
```

---

## 8️⃣ FİLE ANALİZ

MIRAI-yə fayl yükləmək mümkündür:

**Dəstəklənən formatlar:** PDF, DOCX, image (JPG/PNG)

**Use case-lər:**
- Müqavilə → "Bu müqavilədə risk nədir? AZ hüququna uyğundur?"
- Çertyoj → "Bu planda əlillik tələbləri varmı?"
- Smeta → "Bu smeta bazar qiymətlərinə uyğundur?"
- E-poçt screenshot → "Bu müştəriyə necə cavab verim?"

**Texniki:** Base64 encode → Claude vision capability → analiz

**Məhdudiyyət:** Max 5MB / fayl, max 3 fayl / sorğu

---

## 9️⃣ UI — POP-UP CHAT BOX

### Layout
```
┌─────────────────────────────────────────────┐
│  🤖 MIRAI                    [CFO ▾] [✕]   │
│─────────────────────────────────────────────│
│                                             │
│  [Mesajlar sıralanır...]                    │
│                                             │
│  MIRAI:                                     │
│  ┌─────────────────────────────────────┐   │
│  │ Nəriman Towers P&L analizi:         │   │
│  │ • Gross: ₼100,000                   │   │
│  │ • Net (outsource sonrası): ₼75,000  │   │
│  │ • Final (overhead ilə): ₼57,000     │   │
│  └─────────────────────────────────────┘   │
│─────────────────────────────────────────────│
│  [Fayl yüklə 📎]  [Sual yaz...    ] [→]   │
└─────────────────────────────────────────────┘
        Genişlət [⤢]    400px wide, 500px tall
```

### Behavior
- Sağ-aşağı küncündə **dairəvi 56px düymə** (Intercom üslubu)
- Düymədə persona ikonu + unread badge
- Açılışda: son 5 mesaj görünür (scroll to bottom)
- Səhifə dəyişəndə state **qalır** (global React state / Zustand)
- Mobile: full-screen modal (bottom sheet)
- Genişlət: 800px × 600px panel (yan tərəfə keçir)

### Persona seçici (admin üçün)
Dropdown: CFO / HR / COO / CCO / CMO / Chief Architect
User-da dropdown yoxdur (yalnız Chief Architect görsənir)

### Suggestion chips (context-based)
Açılışda 3 sürətli sual (active page-ə görə):
```
Maliyyə Mərkəzindəyirsə:
[Bu ayın P&L-i?] [Forecast riskləri?] [Cash cockpit izah et]

Tapşırıqlardayırsa:
[Bu həftə nə bloklanıb?] [Deadline riski?] [Prioritet sırala]
```

---

## 🔟 COST GUARDİAN

### Rate limiting
```sql
create table mirai_usage (
  id uuid primary key,
  user_id uuid references profiles(id),
  date date,
  request_count int default 0,
  token_input_total int default 0,
  token_output_total int default 0,
  cost_usd numeric default 0,
  primary key (user_id, date)  -- upsert-able
);
```

**Limitlər:**
- Admin: 100 sual/gün
- User: 30 sual/gün
- Şirkət aylıq hard limit: $10 USD (env: `MIRAI_MONTHLY_BUDGET_USD`)

### 10 Optimization (məcburi)

| # | Texnika | Qənaət |
|---|---|---|
| 1 | **Prompt Caching** | ~90% input token endirim (system prompt cache) |
| 2 | **Smart Context Pruning** | Yalnız aktiv page üçün lazım olan DB data inject edilir |
| 3 | **Rate Limiting** | Admin 100/gün, user 30/gün |
| 4 | **Cached Reports** | Eyni sual (hash) 24 saat Redis/DB cache-də |
| 5 | **Batch Endpoint** | Saatlıq proaktiv analiz (Telegram xəbərdarlıq) cron ilə |
| 6 | **Session Compression** | 10 mesajdan sonra conversation xülasəyə endirilir |
| 7 | **Local Heuristics First** | "Balans neçədir?" → SQL cavab verir, AI çağırılmır |
| 8 | **Monthly Budget Cap** | `MIRAI_MONTHLY_BUDGET_USD=10`, hard stop |
| 9 | **Token Counter Dashboard** | Maliyyə Mərkəzindəki widget: bu ay $X / $10 |
| 10 | **Free Fallback** | Limit dolarsa → Groq llama-3.3-70b (pulsuz) |

### Xərc proqnoz

| Ssenari | İstifadəçi | Aylıq xərc |
|---|---|---|
| Minimal (2 admin, 5 user) | ~400 sual/ay | ~$1.20 (~₼2.04) |
| Real (3 admin, 10 user) | ~800 sual/ay | ~$2.30 (~₼3.91) |
| Aktiv (5 admin, 15 user) | ~1,500 sual/ay | ~$4.60 (~₼7.82) |
| Maksimum (hard limit) | — | $10 → Groq fallback |

**Model:** Claude Haiku 4.5 ($0.25/1M input, $1.25/1M output)
**Embedding:** text-embedding-3-small ($0.02/1M tokens)

---

## 📦 DB SCHEMA (tam)

```sql
-- MIRAI session-ları
create table mirai_sessions (
  id uuid primary key,
  user_id uuid references profiles(id),
  persona text,              -- cfo|hr|coo|cco|cmo|chief_architect
  page_context text,
  entity_type text,
  entity_id uuid,
  compressed_history jsonb,  -- 10 mesajdan sonra xülasə
  created_at timestamptz default now(),
  last_active_at timestamptz
);

-- Hər mesaj
create table mirai_messages (
  id uuid primary key,
  session_id uuid references mirai_sessions(id),
  role text,                 -- user|assistant|tool
  content text,
  tool_calls jsonb,
  tool_results jsonb,
  tokens_input int,
  tokens_output int,
  cost_usd numeric,
  cached boolean default false,
  created_at timestamptz default now()
);

-- İstifadə sayğacı
create table mirai_usage (
  user_id uuid references profiles(id),
  date date,
  request_count int default 0,
  token_input_total int default 0,
  token_output_total int default 0,
  cost_usd numeric default 0,
  unique(user_id, date)
);

-- Bilgi bazası (RAG)
create table mirai_knowledge (
  id uuid primary key,
  source_type text,
  source_name text,
  content text,
  embedding vector(1536),
  locale text default 'az',
  valid_from date,
  valid_until date,
  tags text[],
  created_at timestamptz default now()
);
create index on mirai_knowledge using ivfflat (embedding vector_cosine_ops);

-- Performans survey-ləri
create table performance_surveys (
  id uuid primary key,
  survey_year int,
  subject_user_id uuid references profiles(id),
  reviewer_user_id uuid references profiles(id),
  scores jsonb,
  comment text,
  manager_review text,
  final_score numeric,
  created_at timestamptz
);

-- Telegram xəbərdarlıqları
create table telegram_notifications (
  id uuid primary key,
  recipient_user_id uuid references profiles(id),
  telegram_chat_id text,
  message_text text,
  trigger_type text,
  entity_type text,
  entity_id uuid,
  sent_at timestamptz,
  read_at timestamptz,
  mirai_generated boolean default true
);
```

---

## 📅 İCRA PLANI — 3 həftə

| # | Modul | Vaxt |
|---|---|---|
| 1 | Pop-up UI + persona router + privacy filter | 2 gün |
| 2 | Context Engine (page-aware injection) | 1 gün |
| 3 | Tool Layer: query_financials + query_tasks | 2 gün |
| 4 | Cost Guardian (rate limit + budget cap + usage table) | 1 gün |
| 5 | Session Compression + Cached Reports | 1 gün |
| 6 | RAG Engine: pgvector + knowledge table + embed pipeline | 3 gün |
| 7 | Telegram integration (proaktiv + trigger-based) | 2 gün |
| 8 | File Analysis (PDF/image upload → vision) | 1 gün |
| 9 | Performance Tracking (HR persona + survey) | 2 gün |
| 10 | Groq fallback + Token Dashboard widget | 1 gün |

**Cəmi: ~16 iş günü = 3 həftə**

---

## 🚩 RİSKLƏR

1. **Hallüsinasiya** — Maliyyə/hüquqi cavablarda uydurma → Hər cavabda disclaimer + RAG istinadı məcburi
2. **Privacy leak** — User admin datanı soruşur → Privacy Filter + RLS məcburi (DB səviyyəsindədir)
3. **Cost spike** — İstifadəçilər çox sual verir → Rate limit + aylıq hard cap + Groq fallback
4. **RAG freshness** — Qanun dəyişdi, köhnə cavab verildi → `valid_until` sahəsi + illik review
5. **Telegram spam** — Çox xəbərdarlıq işçiləri narahat edir → Max 3 mesaj/gün/istifadəçi, quiet hours (22:00-08:00)
6. **Session data** — Həssas maliyyə data chat historiyasında qalır → mirai_messages RLS: yalnız özünün + admin

---

## ✅ AUTHOR DECISIONS LOG

- User yalnız Chief Architect-ə çıxışı var
- Admin persona manual override edə bilər
- Write actions hər zaman explicit approve tələb edir (auto-write yoxdur)
- RAG AZ 30+ il prioritetdir, global ikinci dərəcəli
- Telegram mesajları yalnız MIRAI tərəfindən göndərilir (manual Telegram botla sync edilmir)
- Performans məlumatı işçilərə il sonu admin göndərir, avtomatik deyil
- File analysis: max 5MB, max 3 fayl/sorğu
- Groq fallback yalnız budget cap aşılanda aktivdir (daimi deyil)
- Session compression 10 mesajdan sonra (deyil 5, çünki kontekst itirilir)
- Token counter Maliyyə Mərkəzindəki MIRAI widgetindədir
