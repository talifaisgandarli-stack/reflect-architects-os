# 💰 MALIYYƏ MƏRKƏZİ — FINAL SPEC

> **Status:** Approved (2026-05-03)
> **Stage:** Pre-PMF → Scaling
> **Constraint:** Pulsuz/ucuz + maksimum avtomatlaşdırma
> **Goal:** CFO-nu əvəz edəcək səviyyə

---

## 🏛️ ARXİTEKTURA — 7 modul + 1 kritik qayda

```
┌───────────────────────────────────────────┐
│  💰 CASH COCKPIT (top bar — hər səhifədə) │
└───────────────────────────────────────────┘
       │
       ├── 1. Balans Ledger-i (Bank + Kassa)
       ├── 2. Layihə P&L (per-project profit)
       ├── 3. Outsource Workflow (hibrid: tapşırıq + maliyyə)
       ├── 4. Cross-Project Funding (MIRAI suggest, manual approve)
       ├── 5. Sabit + 1-dəfəlik Xərclər
       ├── 6. Forecast Engine (30/90/365 gün)
       └── 7. MIRAI CFO Consultant (Pop-up chat)
       
🚨 KRİTİK QAYDA: No Data Loss + Display Parity (aşağıda detal)
```

---

## 1️⃣ CASH COCKPIT (sticky top bar)

**Hər səhifədə görsənir**, üstdə kiçik sticky panel:

```
🏦 Bank: ₼145,000   💵 Kassa: ₼8,500   📊 Cəmi: ₼153,500
📈 30 gün: ₼178K    90 gün: ₼165K     12 ay: ₼240K
💼 Aylıq Reflect xərci (maaş+ofis+marketing): ₼70,000
⚠️ Min. tələb (3 ay runway): ₼210K → Status: ⚠️ Diqqət
```

**Engineer notes:**
- `cash_snapshot` cədvəli — gündəlik snapshot
- Materialized view, hər `incomes`/`expenses` insert-də yenilənir
- Forecast nightly cron-da işləyir
- Min. balans MIRAI hesablayır (son 6 ay average burn × 3)

---

## 2️⃣ LAYİHƏ P&L — 3 səviyyəli görünüş

| Səviyyə | Hesablama | Misal |
|---|---|---|
| **Gross** | Müqavilə dəyəri | ₼100,000 |
| **Net** | Gross – Outsource | ₼75,000 |
| **Final** | Net – Allocated Overhead | ₼57,000 (real qazanc) |

**Allocation rule:**
```
allocated_overhead = monthly_overhead × (project_active_share)
project_active_share = bu_layihəyə_işləyən_saat / ümumi_iş_saatı
```

**Memarlar `tasks` page-də timesheet doldurmalıdır** (məcburi).

**UI:** Hər layihə kartında 3 rəqəm + sağlamlıq simvolu (🟢🟡🔴).

---

## 3️⃣ OUTSOURCE WORKFLOW — Hibrid Model

### A) Tapşırıqlar (operational tracking)
Hər layihə kartında option (checklist kimi):
```
☐ Outsource: Konstruksiya hesablaması
   Contact person: Elnur (Tek-Strukt MMC)
   Cavabdeh şəxs: Aydan (komanda)
   Deadline: 15 May
   Status: Pending / Done / Paid / Cancelled
```

### B) Maliyyə Mərkəzində (financial tracking)
- Ödəniş tarixçəsi
- Təhvil-təslim PDF generasiyası (imza kifayətdir — canvas signature)
- "Ödənildi" düyməsi → `expenses`-ə yazılır → Cash Cockpit yenilənir

### Cancelled status
Cancel basanda **məcburi modal** açılır:
```
Cancel səbəbi:
○ Müştəri imtina etdi
○ Büdcə uyğun deyil
○ Texniki problem
○ Yenidən planlanır
○ Digər: ______
```
Bütün cancelled itemlər → audit log + forecast-dan çıxır.

### DB schema
```sql
create table outsource_items (
  id uuid primary key,
  project_id uuid references projects(id),
  task_id uuid references tasks(id),
  work_title text,
  contact_person text,
  contact_company text,
  responsible_user_id uuid references profiles(id),
  deadline date,
  amount numeric,
  status text default 'pending',  -- pending|done|paid|cancelled
  cancel_reason text,
  delivery_pdf_url text,
  signature_data jsonb,
  created_at timestamptz default now(),
  paid_at timestamptz
);
```

---

## 4️⃣ CROSS-PROJECT FUNDING — MIRAI Smart Suggester

**Qayda:** Layihə sayı fərq etmir. **Həmişə opsiyalar + tövsiyə + soruşur.**

### Misal interaksiya
```
🤖 MIRAI: "Z layihənin maaş ödənişi 3 gün içində çatmır.
₼15,000 lazımdır.

Mövcud opsiyalar:
○ X layihəsi (₼45,000 sərbəst, avans alındı)
○ Y layihəsi (₼20,000 sərbəst, final ödəniş gözlənilir)
○ Sabit kassadan (₼8,500 — yetərsiz)

💡 Tövsiyəm: X layihəsi.
Səbəb: Z 2 ay sonra ₼60K gətirəcək, X-də buffer var, 
final ödəniş 3 ay sonradır.

[X-dən götür] [Y-dən götür] [Ləğv et]"
```

### DB schema
```sql
create table internal_loans (
  id uuid primary key,
  borrowing_project_id uuid,
  lending_project_id uuid,
  amount numeric,
  reason text,
  created_at timestamptz,
  repaid_at timestamptz,
  status text  -- open|repaid|written_off
);
```

**Hər `internal_loan` üçün avtomatik PDF qeydi** (audit trail — vergi orqanı üçün).

---

## 5️⃣ SABİT + 1-DƏFƏLİK XƏRCLƏR

- Mövcud `SabitXercler` + `Xercler` cədvəlləri **silinmir**
- Maliyyə Mərkəzinə **tab kimi** köçürülür
- Sabit xərclərdə **B5 fix**: forma sualı *"Bu məbləğ neçə ayda bir tutulur?"* (1, 3, 6, 12)
- Hər ikisi avtomatik forecast-a qoşulur

---

## 6️⃣ FORECAST ENGINE

### Formula (kritik — outsource ayrı saxlanır)
```
forecast_balance(date) = 
  current_balance 
  + sum(expected_incomes × confidence)
  - sum(reflect_overhead)         ← maaş, ofis, marketinq, abunəliklər
  - sum(outsource_planned)         ← layihə-spesifik
  - sum(one_time_planned)
```

### Confidence scoring
- Müqaviləli + avans alınmış: **95%**
- Müqaviləli, avans yox: **75%**
- Pipeline "icrada": **60%**
- Pipeline "təklif": **30%**
- Pipeline "lead": **10%**

### UI — Forecast Chart
- Sol xətt: **Confident** (90%+ olanlar) — bərk
- Sağ xətt: **Optimistic** (bütün pipeline) — kəsik
- İki xəttin arası = **risk zonası**

### Aylıq actual vs forecast doğrulama
Hər ay sonu sistem confidence formula-nı kalibre edir.

---

## 7️⃣ MIRAI — Chief AI Officer

### Persona-lar (admin: 6, user: 1)
- **CFO** — maliyyə (admin only)
- **HR** — kadr/performans (admin only)
- **COO** — əməliyyat (admin only)
- **CCO** — kommunikasiya (admin only)
- **CMO** — marketinq (admin only)
- **Chief Architect** — sahə eksperti (admin + **user**)

### Bilik bazası (hər persona üçün)
- 🌍 Dünya bazarı: 20 illik təcrübə
- 🇦🇿 Azərbaycan: **30+ il (kritik!)** — qanunvericilik, qaydalar, sahə meyarları
- Gələcəkdə: ölkə-spesifik (TR, BƏƏ və s.)

### User çıxışı
Yalnız Chief Architect → seçim: AZ təcrübəsi / Global

### Telegram inteqrasiyası
MIRAI Telegram mesajlarını **özü göndərir** (mövcud zəif keyfiyyətli mesajları əvəz edir).

### Performans Tracking
- **Adminlər** → aylıq nəticə real-time
- **İşçilər** → yalnız **il sonunda** illik yekun (admin manual göndərir)
- 360° survey + Rəhbər rəyi → illik dəyərləndirməyə daxil
- HR persona avtomatik tövsiyələr verir

### UI — Pop-up Chat Box
- Sağ-aşağı küncdə dairəvi düymə (Intercom üslubu)
- Kliklə 400px modal açılır
- Səhifə dəyişəndə state qalır

### Model: Claude Haiku 4.5
- $0.25/1M input, $1.25/1M output
- Real ssenari (3 admin + 10 user): **~$2.30/ay (~₼3.90)**
- Maksimum: **~$13.70/ay (~₼23.30)**
- Tövsiyə budjet: **₼5/ay**, hard limit: **₼25/ay**

### Optimization-lar (məcburi)
1. **Prompt Caching** (90% endirim cached input)
2. **Smart Context Pruning** (yalnız sual üçün lazımı sahələr)
3. **Rate Limiting** (admin: 100/gün, user: 30/gün)
4. **Cached Reports** (eyni sual 24 saat cache-də)
5. **Batch Endpoint** (saatlıq proaktiv analiz)
6. **Session Compression** (10 mesajdan sonra xülasə)
7. **Local Heuristics First** (sadə sualları SQL ilə)
8. **Aylıq Budjet Limit** (`MIRAI_MONTHLY_BUDGET_USD=10`)
9. **Token Counter Dashboard** (Maliyyə Mərkəzində widget)
10. **Free Fallback** (limit dolarsa Groq llama-3.3 pulsuz)

---

## 🚨 KRİTİK QAYDA — No Data Loss + Display Parity

### Qayda 1: DB-də heç nə silinmir
```sql
-- Heç vaxt:
DROP TABLE old_invoices;     ❌
DROP COLUMN x;                ❌

-- Əvəzinə:
ALTER TABLE old_invoices RENAME TO _archived_invoices_2026;  ✅
ALTER TABLE x ADD COLUMN deprecated_x_was text;              ✅
```

### Qayda 2: Köhnə məlumat yeni səhifələrdə tam, doğru görünür
**3 mərhələli prosess hər miqrasiya üçün:**

#### Mərhələ 1: Schema Backward-Compatible
- Köhnə cədvəl toxunulmur
- Yeni cədvəl paralel yaradılır
- Birləşdirici `view` yaradılır
- Yeni page həmişə view-dan oxuyur

#### Mərhələ 2: Data Parity Test (avtomatik, deploy-dən əvvəl)
```sql
-- Köhnə vs yeni count + sum
select count(*), sum(amount) from old_table;
select count(*), sum(amount) from unified_view;
-- Fərq varsa → deploy bloklanır
```

#### Mərhələ 3: Vizual Parity Audit (manual)
Hər yeni səhifə üçün checklist:
- ☐ Bütün sahələr görsənir?
- ☐ Bütün filtrlər işləyir?
- ☐ Bütün düymələr (silmə, redaktə, ixrac) qalır?
- ☐ Hər köhnə qeyd → eyni detail açılır?
- ☐ Before/after screenshot pair → istifadəçi təsdiqi

### Qayda 3: Bütün migration-lar reversible
- `up()` + `down()` məcburi
- `pg_dump` backup avtomatik

---

## 📋 Outsource → Expenses əksetdirməsi

| Yer | Görünüş |
|---|---|
| Cash Cockpit (real balans) | ✅ Daxil edilir (real pul çıxıb) |
| Aylıq xərc cədvəli | ✅ "Outsource" kateqoriyasında |
| Ümumi forecast (Reflect overhead) | ❌ DAXİL DEYİL (layihə-spesifikdir) |
| Layihə P&L | ✅ Net hesablamada |
| Forecast — outsource_planned | ✅ Ayrı sətirdə (deadline-na görə) |

---

## 📅 İCRA PLANI — 4 həftə

| # | Modul | Vaxt |
|---|---|---|
| 1 | Cash Cockpit + maaş overhead | 2 gün |
| 2 | Layihə P&L (overhead allocation) | 3 gün |
| 3 | Outsource Hibrid (Tapşırıq + Maliyyə) | 4 gün |
| 4 | Cross-funding (MIRAI suggest) | 2 gün |
| 5 | Sabit/1-dəfəlik refactor | 1 gün |
| 6 | Forecast Engine | 2 gün |
| 7 | MIRAI Pop-up Chat (Haiku + caching) | 3 gün |
| 8 | Cancelled status + reason | 1 gün |
| 9 | **Data Protection Layer + Parity Test** | **2 gün** |

**Cəmi: ~20 iş günü = 4 həftə**

---

## 🚩 RİSKLƏR (PM tracked)

1. **Vergi auditi** — Cross-project funding "şirkət daxili oğurluq" kimi yozulmasın → hər loan üçün PDF qeydi
2. **Overhead allocation** — Memarlar timesheet doldurmasa, P&L səhv olar → tapşırıqlarda timesheet məcburi
3. **MIRAI hallüsinasiya** — Maliyyə suallarında səhv cavab → hər cavabda disclaimer + MIRAI mənbələri göstərir
4. **Forecast confidence** — Səhv kalibrə yanlış güvən verir → aylıq actual vs forecast doğrulaması
5. **AZ hüquqi audit** — Canvas signature zəif sübutdur → IP + timestamp + e-poçt zəncir saxlanır

---

## ✅ AVTHOR DECISIONS LOG

- VAT həmişə 18% (AZ-də sabit) — vat_rate sahəsi DB-də qalır amma UI-də gizli
- İşçilər gəlir/xərc görmür (D1)
- Tapşırıqda klient adı lazım deyil (C2)
- A1 Hesab-Faktura page silinir, D5 PDF template ilə əvəz olunur
- Invoices cədvəli **silinmir** (data preserved)
- Müştəri retrospektiv anketi avtomatik göndərilir (template hazır)
- Email avtomatik PDF kimi platformaya düşür (manual yükləmə yox)
- Rəsmi məktub template platformada → PDF endir → manual göndər
- Auto Task Planner: avans alındığı ilk gündən
- Müqavilə yoxdursa layihə deadline məcburi
- Smart Closeout checklist: təhvil-təslim, anket, portfolio namizədi
- Arxiv səhifəsi mütləqdir (performansa təsir edir)
- MIRAI 6 persona admin / 1 persona user
- AZ təcrübəsi 30+ il prioritet
- Pulsuz/ucuz + maksimum effektivlik
