# 👥 MÜŞTƏRİ LIFECYCLE (A10 + C6) — FINAL SPEC

> **Status:** Approved (2026-05-03)
> **Stage:** Pre-PMF → Scaling
> **Constraint:** Pulsuz/ucuz + maksimum avtomatlaşdırma
> **Goal:** A10 + C6 audit həllərini birləşdirib müştəri-mərkəzli lifecycle yaratmaq

---

## 🏛️ ARXİTEKTURA — 8 modul + Şablon Mərkəzi

```
┌───────────────────────────────────────────────────┐
│  👥 MÜŞTƏRİLƏR (tək page, 3 görünüş: Pipeline /   │
│   Cədvəl / Detail)                                │
└───────────────────────────────────────────────────┘
       │
       ├── 1. Pipeline Stages (memarlıq-spesifik)
       ├── 2. Müştəri Detail Panel (Attio model)
       ├── 3. Layihə Sənəd Mərkəzi (link-əsaslı)
       ├── 4. Workload Estimator (3 variant + Net Income)
       ├── 5. Retrospektiv Anket (share link)
       ├── 6. Communication Hub (BCC email + məktub composer)
       ├── 7. Forecast bağlantı (weighted pipeline)
       └── 8. MIRAI Chief Architect (user) + RAG (AZDNT)

🎨 ƏLAVƏ MODUL: Şablon Mərkəzi (Parametrlər səhifəsində)
🚨 KRİTİK: No Data Loss + Display Parity (Maliyyə Mərkəzi spec-i ilə eyni)
```

---

## 1️⃣ PIPELINE STAGES — Memarlıq-spesifik

| # | Mərhələ | Mənası | Confidence (forecast) |
|---|---------|--------|----------------------|
| 1 | **Lead** (Potensial) | İlk əlaqə | 10% |
| 2 | **Təklif** (Proposal) | Kommersiya təklifi göndərildi | 30% |
| 3 | **Müzakirə** (Negotiation) | Müştəri ilə danışıq aktiv | 50% |
| 4 | **İmzalanıb** (Contract) | Müqavilə imzalandı, avans yox | 75% |
| 5 | **İcrada** (Active) | Avans alındı | 95% |
| 6 | **Bitib** (Completed) | Layihə tamamlandı | — |
| 7 | **Arxiv** (Archived) | 6+ ay geri qalır | — |
| 8 | **İtirildi** (Lost) | Səbəb məcburi | 0% |

### Mərhələ keçidi qaydaları (A10 fix)
- Mərhələ atlamaq olmaz (məcburi sıra)
- Hər keçiddə məcburi sahələr:
  - Lead → Təklif: təklif tarixi + məbləğ
  - Təklif → Müzakirə: müştəri cavabı qeyd
  - Müzakirə → İmzalanıb: müqavilə link
  - İmzalanıb → İcrada: avans qeyd
  - İcrada → Bitib: təhvil-təslim aktı + final ödəniş
  - **İtirildi**: səbəb (enum) + qısa qeyd
- **Override** mümkündür yalnız adminlərdə (səbəb məcburi)

### Arxiv qaydası
- 6+ ay aktivlik olmadıqda → avtomatik arxivə düşür
- Arxivdə qala bilər (silinmir, problem yoxdur)
- **Əgər silmə qaydası tətbiq olunsa:** silinmədən **1 ay öncə** export linki avtomatik göndərilir

---

## 2️⃣ MÜŞTƏRİ DETAIL PANEL — Attio Model + Cash Forecast

### UI layout
```
┌──────────────────────────────────────────────────────┐
│ ← Bilgə Qrup                          [Edit] [Arxiv] │
├──────────────────────────────────────────────────────┤
│ 📊 STATİSTİKA                                        │
│ Ümumi gəlir: ₼285,000  |  Layihə sayı: 3            │
│ İlk əlaqə: 2024-08    |  Son layihə: 2026-04        │
│ Ortalama layihə dəyəri: ₼95,000                     │
├──────────────────────────────────────────────────────┤
│ 📅 TIMELINE (stage_history-dən avtomatik)            │
├──────────────────────────────────────────────────────┤
│ 🏗️ LAYİHƏLƏR                                         │
├──────────────────────────────────────────────────────┤
│ 📂 SƏNƏDLƏR (link-əsaslı)                            │
│ 🎯 KOMMUNIKASIYA (email + məktub)                    │
│ 👤 ƏLAQƏ ŞƏXSLƏRİ                                   │
└──────────────────────────────────────────────────────┘
```

### DB schema
```sql
alter table clients add column 
  expected_value numeric,
  confidence_pct numeric,
  expected_close_date date,
  lost_reason text,
  archived_at timestamptz,
  total_lifetime_value numeric;

create table client_stage_history (
  id uuid primary key,
  client_id uuid references clients(id),
  from_stage text,
  to_stage text,
  changed_at timestamptz default now(),
  changed_by uuid references profiles(id),
  notes text
);
```

---

## 3️⃣ SƏNƏD MƏRKƏZİ — Link-əsaslı (sadələşdirilmiş)

### Skop azaldı
- ❌ Texniki çertyojlar/render-lər/fotolar — **Reflect-də yoxdur**
- ✅ Yalnız hüquqi/maliyyə sənədlər

### Kateqoriyalar
| Kateqoriya | Source | Action |
|-----------|--------|--------|
| Müqavilə | **Drive linki** | Link əlavə + Preview (Drive viewer) + Paylaş |
| Qiymət protokolu | **Drive linki** | Link əlavə + Preview + Paylaş |
| Hesab-faktura | Reflect generasiya (template) | PDF endir + Paylaş |
| Təhvil-təslim aktı | Reflect generasiya (template) | PDF endir + Paylaş |
| Outsource aktları | Avto (Maliyyə Mərkəzindən) | PDF endir |
| Email yazışmaları | BCC capture (avto) | Daxili görünüş |
| Rəsmi məktublar | Composer (avto) | PDF endir + Email göndər |

### "Preview / Download / Paylaş link" izahı
1. **Preview** — sənədi platforma daxilində aç (download etmədən)
2. **Download** — kompüterə endir
3. **Paylaş link (token)** — `reflect.app/sened/abc123xyz` kimi xüsusi link. Müştəri linkə klik → hesabsız sənədi görür. Token istənilən vaxt iptal edilə bilər.
   - Drive linkləri üçün: proxy ilə açılır (kim baxdı qeydiyyatda)

### DB schema
```sql
create table project_documents (
  id uuid primary key,
  project_id uuid references projects(id),
  category text,             -- contract|price_protocol|invoice|act|email|letter|outsource_act
  title text,
  external_link text,        -- Drive linki
  internal_file_url text,    -- Reflect Storage (auto-gen)
  source text,               -- 'drive_link'|'auto_generated'|'email_capture'
  share_token text unique,
  metadata jsonb,
  created_at timestamptz
);
```

### Storage
- Texniki fayl olmadığı üçün storage problemi yoxdur
- Supabase 1 GB pulsuz tier kifayətdir
- Drive link checking — **istənmir** (avtomatik yoxlama qoyulmur)

---

## 4️⃣ WORKLOAD ESTIMATOR (3 variant + Net Income)

### Hesablama
```
team_capacity = sum(member.work_hours × member.availability)
project_estimate = sum(stage.estimated_hours)

variants = {
  fastest:    days × 0.6,
  medium:     days × 1.0,
  comfortable:days × 1.5
}

net_income_estimate = contract_value 
  - estimated_outsource_cost
  - allocated_overhead
```

### UI
```
Müştəri: Bilgə Qrup
Layihə: Yay evi (200 m²)

📊 Komandanın hazırkı yükü: 65% (sağlam)

⏱️ Çatdırılma müddətləri:
○ ⚡ Ən tez: 6 həftə
○ 🎯 Orta: 10 həftə
○ 🌿 Tam rahat: 14 həftə

💰 Net qazanc proqnozu (₼100K müqavilə):
   Müqavilə dəyəri:        ₼100,000
   – Outsource (estimate):  ₼25,000
   – Overhead allocation:   ₼18,000
   ────────────────────────────────
   Reflect-ə net qalır:     ₼57,000

💡 MIRAI tövsiyəsi: 10 həftə + ₼100K müqavilə.
Səbəb: Komanda yükü uyğundur, net qazanc 57% — sağlamdır.
```

### Müştərilər səhifəsinin başlığında
```
🟢 Komanda yükü: 65% (sağlam)
⚠️ Yeni layihə qəbul edə bilirik (3 nəfərdə boşluq var)
```

---

## 5️⃣ RETROSPEKTİV ANKET — Share Link

### Axın
1. Layihə "Bitib"-ə keçəndə → **göndər düyməsi** açılır
2. Sistem unique token ilə link yaradır: `reflect.app/retro/abc123xyz`
3. Linki müştəriyə email/WhatsApp ilə göndərirsən
4. Müştəri linkə klik → Reflect-də açılır → suallara cavab verir → submit
5. Cavablar admin panelə düşür + NPS hesablanır

### DB schema
```sql
create table retrospective_surveys (
  id uuid primary key,
  project_id uuid references projects(id),
  client_id uuid references clients(id),
  template_id uuid references templates(id),  -- şablon mərkəzindən
  share_token text unique,
  sent_at timestamptz,
  responded_at timestamptz,
  ratings jsonb,
  comment text,
  nps_score int
);
```

### NPS Dashboard
```
📈 NPS Score (son 12 ay): 8.2/10
✅ Tövsiyəçilər: 75%  ⚠️ Passivlər: 20%  ❌ Tənqidçilər: 5%
```

---

## 6️⃣ COMMUNICATION HUB

### A) Email Capture — BCC Trick (pulsuz)
İşçi email göndərir → BCC: `talifa-capture@reflect.app` (şəxsi ünvan, müştəriyə görsənmir) → sistem email-i alır → AI ilə müştəri/layihə tapır → `project_documents`-a 'email' kateqoriyada PDF kimi yazır.

**Implementation:** Resend webhook + pgvector match (client_email pattern).

### B) Rəsmi Məktub Composer
- WYSIWYG editor + dəyişənlər
- Şablon Mərkəzindən şablon seçimi
- Logo + möhür auto
- "PDF endir" / "Email göndər" / "Yadda saxla"
- Hər layihənin sənəd mərkəzinə avtomatik düşür

---

## 7️⃣ FORECAST-A BAĞLANTI

```
weighted_pipeline_value = sum(client.expected_value × client.confidence_pct)
```

Görsənir:
- Müştərilər səhifəsi başlığında
- Cash Cockpit-də (Maliyyə Mərkəzi spec-dən)
- MIRAI CFO sualına cavab

---

## 8️⃣ MIRAI Chief Architect (User-lər üçün)

### Sahə eksperti rolu
**User-lər istifadə edir** (yalnız bu persona). Suallar:

**AZ-spesifik:**
- *"AZDNT normativlərinə uyğun kafe layihəsi necə olmalıdır?"*
- *"Ekspertiza Aşıqlıq layihəsinə hansı iradlar verə bilər?"*
- *"Bakı şəhər salınmasında kommersiya obyekti üçün məsafələr?"*

**File analizi (ZIP/PDF):**
- *"Bu zip faylındakı sənədləri oxu və xülasə et"*
- *"Bu çertyoj A1 standartlarına uyğundur?"*

### Knowledge Base — RAG (pulsuz)
1. AZDNT PDF-ləri **Talifa yığacaq** (ilk versiya: 5-10 ən vacib normativ)
2. PDF-lər **embedding-ə çevrilir** (Supabase pgvector — pulsuz)
3. User sualında semantik axtarış → uyğun normativ parçaları context-ə qoşulur → Claude Haiku cavab verir
4. Bu **RAG (Retrieval-Augmented Generation)** patternidir

### File analizi
- ZIP yüklənir → backend açır → PDF-lər Claude file API-ya
- Limit: 10 MB / fayl, 25 MB / ZIP
- **Loading state:** "Bu sual 30 saniyəyə qədər çəkə bilər" disclaimer
- Progress indicator

### Persona izolasiyası
```javascript
const persona = user.role === 'admin' 
  ? requestedPersona  // CFO, HR, COO, CCO, CMO, Chief Architect
  : 'chief_architect' // user üçün hardcoded

const mode = userChoice // 'az' | 'global'
```

---

## 🎨 ŞABLON MƏRKƏZİ (yeni modul)

### Yer
Parametrlər → Şablonlar

### İki kateqoriya

#### A) Adminlər özləri yaradır
- **Məktub** (rəsmi yazışma)
- **Hesab-faktura**
- **Təhvil-təslim aktı (sifarişçi ilə)**

Bunlar firma identikasına aid olduğu üçün **boş başlanğıc** + admin doldurur.

#### B) Sistem default olaraq verir (2 template hər biri üçün)
- **Email şablonları** (təşəkkür, faktura göndəriş)
- **Akt şablonu (podratçı ilə)** — 2 versiya:
  - Individual podratçı
  - Şirkət podratçı
- **Anket şablonları** — retrospektiv survey

Defaultlar **excel-yükləmə + word-yazma** stilində — admin redaktə edə bilər.

### DB schema
```sql
create table templates (
  id uuid primary key,
  category text,           -- letter|invoice|delivery_act|email|outsource_act|survey
  subcategory text,        -- "individual"|"company" və s.
  name text,
  language text default 'az',  -- az|en|ru
  body_html text,          -- WYSIWYG output
  variables jsonb,         -- ["client_name", "amount", ...]
  is_default boolean default false,  -- sistem default-u
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz
);
```

### UI
```
┌─ Şablon Mərkəzi ─────────────────────────────┐
│                                              │
│ 📧 Email Şablonları (sistem-default)         │
│   ▸ Təşəkkür mesajı (hazır)                  │
│   ▸ Faktura göndəriş (hazır)                 │
│   [+ Yeni şablon]                            │
│                                              │
│ 📄 Rəsmi Məktub Şablonları (özünüz)          │
│   (boşdur — yeni şablon əlavə edin)          │
│   [+ Yeni şablon]                            │
│                                              │
│ 📋 Akt Şablonları                            │
│   • Sifarişçi ilə (özünüz) [+]               │
│   • Podratçı (individual) — sistem-default   │
│   • Podratçı (şirkət) — sistem-default       │
│                                              │
│ 💰 Hesab-Faktura (özünüz)                    │
│   (boşdur — yeni şablon əlavə edin)          │
│   [+ Yeni şablon]                            │
│                                              │
│ 📊 Anket Şablonları (sistem-default)         │
│   ▸ Müştəri retrospektiv (hazır)             │
│   [+ Yeni şablon]                            │
└──────────────────────────────────────────────┘
```

### Dəyişənlər (variables)
Hər şablonda `{{...}}` formatında istifadə olunur:
- `{{client_name}}` — müştəri adı
- `{{client_address}}` — müştəri ünvanı
- `{{project_name}}` — layihə adı
- `{{contract_amount}}` — müqavilə dəyəri
- `{{vat_amount}}` — ƏDV
- `{{total_amount}}` — cəmi
- `{{date}}` — bugünkü tarix
- `{{author_name}}` — göndərən
- `{{author_position}}` — göndərənin vəzifəsi

İstifadə zamanı dəyişənlər avtomatik doldurulur, sonra manual redaktə mümkündür.

---

## 🚨 KRİTİK QAYDA — Data Migration (No Loss + Display Parity)

Maliyyə Mərkəzi spec-də olduğu kimi:
1. Heç bir cədvəl/sütun silinmir
2. Mövcud cədvəllər (clients, proposals, projects) yenidən istifadə olunur
3. Yeni cədvəllər paralel yaradılır
4. Birləşdirici view-lar lazım olduqda
5. Data Parity Test (avtomatik, deploy-dən əvvəl)
6. Vizual Parity Audit (manual, before/after screenshot)

---

## 📅 İCRA PLANI — 5 həftə

| # | Modul | Vaxt |
|---|---|---|
| 1 | DB schema + Migration (no-loss) | 2 gün |
| 2 | Pipeline Stages (memarlıq, A10 fix) | 2 gün |
| 3 | Müştəri Detail Panel (Attio model) | 3 gün |
| 4 | Sənəd Mərkəzi (link-əsaslı) | 2 gün |
| 5 | Workload Estimator + Net Income | 3 gün |
| 6 | Retro Anket (share link) | 2 gün |
| 7 | Communication Hub (BCC + composer) | 3 gün |
| 8 | Şablon Mərkəzi | 3 gün |
| 9 | MIRAI Chief Architect + RAG (AZDNT pgvector) | 3 gün |
| 10 | Display Parity audit | 1 gün |
| 11 | Arxiv → Export Link (1 ay öncə) | 1 gün |

**Cəmi: ~25 iş günü = 5 həftə**

---

## 🚩 RİSKLƏR (final)

1. **AZDNT PDF-ləri Talifa yığacaq** — 5-10 normativ kifayətdir ilk versiya üçün
2. **Drive link yoxlaması — istənmir** (skip)
3. **Şablonlar:** Talifa yaradır → məktub, hesab-faktura, təhvil-təslim aktı (sifarişçi). Sistem yaradır → email, podratçı aktı (individual + şirkət), anket
4. **MIRAI ZIP analizi:** Loading state + 30 san disclaimer
5. **BCC capture privacy:** İşçi email-də BCC ünvanı şəxsi (talifa-capture@) — müştəriyə görsənmir
6. **Workload Estimator dəqiqliyi:** İlk 2 ay manual təsdiq, sonra AI öyrənir

---

## ✅ AVTHOR DECISIONS LOG (final)

- Pipeline memarlıq-spesifik (8 mərhələ, invoice yox)
- Mərhələ atlamaq qadağan (admin override + səbəb məcburi)
- Arxiv silinmir (problem yoxdur), silinsə 1 ay öncə export
- Detail Panel: Attio + Variant B mix
- Sənədlər: yalnız hüquqi/maliyyə (texniki yox)
- Müqavilə/protokol: Drive linki + Reflect-də sadəcə link
- Workload Estimator: 3 variant + Net Income hesablanması
- Retro anket: share link (Reflect-də açılır)
- Email: BCC trick (pulsuz)
- Rəsmi məktub composer: yes
- Şablonlar: hibrid model (özümüz + sistem-default)
- MIRAI Chief Architect: user üçün, AZ + Global mode
- AZDNT RAG: Supabase pgvector (pulsuz)
- File analizi: ZIP/PDF (Claude file API)
- Drive link checking: skip
- Display Parity: məcburi
