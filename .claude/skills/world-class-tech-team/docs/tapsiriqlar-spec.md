# 📋 TAPŞIRIQLAR + SMART CLOSEOUT + ARXİV — FINAL SPEC v2

> **Status:** Approved (2026-05-03)
> **Stage:** Pre-PMF → Scaling
> **Goal:** Memarlıq sahəsi üçün ağıllı task management + closeout + arxiv

---

## 🚨 KRİTİK QAYDA — ZERO DATA LOSS

> **PLATFORMADAKI HEÇ BİR MƏLUMAT SİLİNMƏMƏLİDİR!**
> **Mövcud məlumatlar yeni sistemə tam dəqiqliyi ilə köçürülməlidir!**

- Hər mövcud tapşırıq, şərh, subtask, file → yeni model-də 1:1 əks olunur
- Hər köhnə status → yeni status modelinə map olunur (heç biri itmir)
- Mövcud kommentlər və mention-lar tam saxlanır
- Migration script-də verifikasiya: row count + content hash müqayisə
- Backup məcburi (pg_dump) — migration-dan əvvəl

---

## 🏛️ ARXİTEKTURA — 8 modul

```
┌────────────────────────────────────────────────┐
│  📋 TAPŞIRIQLAR (3 görünüş: Kanban + Cədvəl +  │
│   Mənim) — Calendar AYRI PAGE-də qalır         │
└────────────────────────────────────────────────┘
       │
       ├── 1. Status Modeli (7 status + portfolio)
       ├── 2. Hierarxiya: Card → Task → Subtask
       ├── 3. Auto Planner (asılılıq + risk + EKSPERTİZA)
       ├── 4. Müddət (gün/həftə)
       ├── 5. Outsource bağlantı (privacy aware)
       ├── 6. Smart Closeout + Portfolio (custom awards)
       ├── 7. Arxiv (rol-əsaslı access)
       ├── 8. Aktivlik Log (Trello-style, MIRAI-feed)
```

---

## 1️⃣ STATUS MODELİ

```
İdeyalar → Başlanmayıb → İcrada → Yoxlamada → Ekspertizada → Tamamlandı → Portfolio keçid
                                                                     ↓
                                                                Cancelled
```

| Status | Mənası |
|--------|--------|
| **İdeyalar** | Düşünülür, hələ planlanmayıb |
| **Başlanmayıb** | Planlandı, icra başlamayıb |
| **İcrada** | Aktiv iş gedir |
| **Yoxlamada** | Daxili keyfiyyət yoxlaması |
| **Ekspertizada** | Xarici ekspertiza/dövlət təsdiqi gözlənilir |
| **Tamamlandı** | Bitdi → Portfolio workflow başlayır |
| **Cancelled** | Ləğv edildi (səbəb məcburi) |

### Cancelled səbəbi (məcburi)
```
○ Müştəri imtina etdi
○ Layihə dəyişdi
○ Texniki problem
○ Yenidən planlaşdırılır
○ Digər: ______
```

### Köhnə status migrasiyası (data preservation)
| Köhnə | Yeni |
|-------|------|
| `todo` | `başlanmayıb` |
| `in_progress` | `İcrada` |
| `review` | `Yoxlamada` |
| `done` | `Tamamlandı` |
| `archived` | qalır + status → tamamlandı |

**Heç bir tapşırıq itmir.**

---

## 2️⃣ HİERARXİYA — Card → Task → Subtask

### 3 səviyyə:
```
🏗️ LAYİHƏ X (CARD)
   └── 📋 Tam işçi layihənin hazırlanması (TASK)
        ├── ☐ Plan layihəsinin hazırlanması (SUBTASK)
        ├── ☐ Elevation planın hazırlanması (SUBTASK)
        ├── ☐ Tirlər və konstruksiya (SUBTASK)
        └── ☐ Detallar (SUBTASK)
   └── 📋 Konsept hazırlanması (TASK)
        ├── ☐ Mass plan (SUBTASK)
        └── ☐ 3D görünüş (SUBTASK)
```

### DB schema (mövcud `task_checklists` istifadə olunur)
```sql
-- tasks: əsas iş (memarın "işi")
-- task_checklists: subtask (texniki addım)

-- Mövcud cədvəllər saxlanır:
tasks (mövcud, yeni sahələrlə)
task_checklists (mövcud — subtask kimi istifadə)
task_comments (mövcud)
```

### UI dəyişikliyi
- Tapşırıq detail panelində **Subtask** bölməsi (mövcud `task_checklists` ilə)
- Hər subtask: ad, deadline, assignee (komandadan), tamamlandı checkbox
- Auto Planner subtask-ları **avtomatik yarada bilər** (məs. işçi layihə üçün)

---

## 3️⃣ AUTO TASK PLANNER — Ekspertiza-aware

### Memar input-u (sadə)
```
İş adı: Tam işçi layihənin hazırlanması
Outsource? ☑ Bəli  ☐ Xeyr
Outsource icraçısı: [boş qala bilər]
Asılılıq: [Eskiz layihə bitməlidir]
Estimated müddət: 4 [həftə ▼]
```

### MIRAI hesablama
```
Estimated duration: 4 həftə
Outsource buffer: +30%
Real planlama: 5.2 həftə
Auto start_date: Eskiz bitməsindən sonra
Auto deadline: 24 İyun
```

### EKSPERTİZA HANDLING (kritik yeni)

Layihə ekspertizaya gedəcəksə → **avtomatik subtask-lar əlavə olunur:**

```
🏗️ LAYİHƏ: Bilgə Qrup — Yay evi
   Müqavilə bitmə: 15 Avq 2026

   📋 Tam işçi layihənin hazırlanması
        ├── ☐ Texniki sənədlərin hazırlanması
        ├── ☐ Çertyojlar (plan, kəsik, fasad)
        └── ☐ ...

   📋 EKSPERTİZA (avtomatik)
        ├── ☐ Ekspertiza üçün çap sənədlərinin hazırlanması (3 gün)
        ├── ☐ Ekspertizaya göndərmək (1 gün)
        ├── ☐ Ekspertiza cavabı gözləmə (max 1 ay = 30 gün)
        ├── ☐ İrad düzəltmə (10 gün buffer — irad gəlsə)
        └── ☐ Son təsdiq alınması
        
        🎯 Hədəf: Ekspertiza son təsdiqi müqavilə bitməsindən
                  7-10 gün ƏVVƏL gəlməlidir
                  → Ödəniş alımağa vaxtımız olsun
```

### Geriyə doğru hesablama (backward planning)
```js
// MIRAI alqoritmi
const deadline = project.contract_deadline  // 15 Avq
const paymentBuffer = 10  // gün — ödəniş üçün
const expertiseFinalDate = subtractBusinessDays(deadline, paymentBuffer)
// → 5 Avq

const expertiseRevisionBuffer = 10  // irad düzəltmə
const expertiseSubmitDate = subtractBusinessDays(expertiseFinalDate, 30 + 10)
// → 12 İyun

const designFinalDate = subtractBusinessDays(expertiseSubmitDate, 3)  // çap hazırlığı
// → 9 İyun

// Layihə işçi sənədləri 9 İyun-a qədər tamamlanmalıdır
```

### Proposal hesablamasında nəzərə alınma
**📊 PM kritik:** Yeni proposal hazırlananda **MIRAI ekspertiza vaxtını da əlavə edir:**

```
Müştəri: Bilgə Qrup
Layihə tipi: Yaşayış evi (200 m²)
Ekspertiza tələb olunur: ☑ Bəli

⏱️ Çatdırılma müddəti hesablaması:
- Konsept: 2 həftə
- Eskiz: 3 həftə  
- İşçi layihə: 4 həftə
- Ekspertiza paketi: 3 gün
- Ekspertiza gözləmə: 30 gün (max)
- İrad düzəltmə buffer: 10 gün
- Son təsdiq + ödəniş buffer: 10 gün
─────────────────────────────────
CƏMİ MİNİMUM: ~14 həftə
```

### Outsource icraçısı boş qala bilər
- Yaranma zamanı: yalnız ad + outsource (Y/N) + müddət
- İcraçı sonradan əlavə olunur (proses zamanı müəyyənləşir)

### Asılılıq (dependency)
- Tapşırıq B → Tapşırıq A asılıdır
- A bitməsə B-nin status `İcrada`-ya keçməsi blok
- A-nın deadline dəyişəndə B avtomatik yenilənir
- MIRAI gecikmə zəncirini görsətər

### Stage template-ləri (Şablon Mərkəzində — Talifa redaktə edə bilər)
**Tipik mərhələlər:**
- **Yaşayış evi:** Konsept (2h) → Eskiz (3h) → İşçi (4h) → Ekspertiza (6h) → Müəllif (5h)
- **Kommersiya:** Konsept (3h) → Eskiz (5h) → İşçi (7h) → Ekspertiza (6h) → Müəllif (4h)
- **İnteryer:** Konsept (1h) → 3D (2h) → İşçi (3h) → Müəllif (2h) (ekspertiza yox)
- **Şəhərsalma:** Konsept (3h) → Master plan (6h) → Detallar (10h) → Ekspertiza (6h) → Müəllif (4h)

(*h = həftə*)

### DB
```sql
alter table tasks add column
  start_date date,
  estimated_duration int,
  duration_unit text default 'days',
  risk_buffer_pct int default 0,
  is_expertise_subtask boolean default false,
  workload_calculated_at timestamptz;

alter table projects add column
  requires_expertise boolean default false,
  expertise_deadline date,
  payment_buffer_days int default 10;
```

---

## 4️⃣ MÜDDƏT — Gün/Həftə (saat YOX)

- Hər tapşırıqda **estimated duration**: gün və ya həftə
- **Actual duration** avtomatik: `completed_at - start_date`
- Timesheet/saat qeydi YOXDUR
- Layihə P&L overhead allocation `tasks.actual_duration_days × user.daily_rate` formuluna görə

---

## 5️⃣ OUTSOURCE BAĞLANTISI — Privacy Aware

### Tapşırıqda görsənənlər (User üçün)
```
☑ Outsource: Konstruksiya hesablaması
   Contact person: Elnur (Tek-Strukt MMC)
   Cavabdeh şəxs: Aydan (komanda)
   Deadline: 15 May
   Status: Pending / Done / Cancelled
```

### Tapşırıqda GÖRSƏNMƏYƏNLƏR (user üçün)
- ❌ `paid` status
- ❌ `amount`
- ❌ `payment_method`
- ❌ Hər hansı maliyyə məlumatı

### MIRAI privacy filter
User pul/budget/maaş ilə bağlı sual verəndə:

> *"Hörmətli istifadəçi, maliyyə məlumatlarımız korporativ məxfilik qaydalarımıza tabedir — Reflect-də belə suallar etik sayılmır 😊 Sahə eksperti kimi memarlıq sualınız varsa, məmnuniyyətlə cavablandırım!"*

**Tone:** Mədəni + yüngül satirik. Utandırmadan amma aydın.

---

## 6️⃣ SMART CLOSEOUT + PORTFOLIO

### Closeout checklist (redaktə oluna bilən)
```
✅ LAYİHƏ TAMAMLANMA
─────────────────────────────────
☐ Sifarişçi ilə final təhvil-təslim edilib  [redaktə] [sil]
☐ Müştəri retrospektiv anketi göndərildi    [redaktə] [sil]
☐ Portfolio namizədi (Y/N)
   ○ Bəli → Portfolio workflow açılır
   ○ Xeyr → keç

[+ Yeni checkbox əlavə et]
```

### Portfolio workflow (custom awards)
```
🏆 PORTFOLIO HAZIRLIĞI
──────────────────────
Checklist (redaktə oluna bilən):
☐ Müştəridən icazə alındı                  [redaktə] [sil]
☐ Foto/render hazırdır                      [redaktə] [sil]
☐ Layihə təsviri yazıldı                    [redaktə] [sil]
☐ Komanda kreditləri qeyd olundu            [redaktə] [sil]
[+ Yeni əlavə et]

🎖️ AWARD NAMİZƏDLİYİ
──────────────────────
Sistem awardları (statik):
☐ Aga Khan Award for Architecture
☐ MIPIM Awards
☐ World Architecture Festival
☐ Dezeen Awards
☐ ArchDaily Building of the Year
☐ Architizer A+Awards
☐ RIBA International Awards

Öz awardlarım:
☐ State Architecture Award (AZ)             [əlavə etdim] [sil]
[+ Yeni award əlavə et]

📅 Veb sayta əlavə tarixi: [____]
✏️ Press release yazılacaq? ☐
```

### DB
```sql
create table closeout_checklists (
  id uuid primary key,
  project_id uuid references projects(id),
  items jsonb,  -- [{label, checked, is_default, can_delete}, ...]
  closed_at timestamptz,
  closed_by uuid
);

create table portfolio_workflows (
  id uuid primary key,
  project_id uuid references projects(id),
  checklist_items jsonb,
  selected_awards jsonb,
  website_publish_date date,
  press_release_planned boolean
);

create table system_awards (
  id uuid primary key,
  name text,
  region text,
  category text,
  application_url text,
  deadline_month int
);
```

---

## 7️⃣ ARXİV SİSTEMİ — Rol-əsaslı

### Access qaydası
| Rol | Arxivdə görünən |
|-----|-----------------|
| **Admin** | Hər şey (layihə, müştəri, tapşırıq, sənəd, maliyyə) |
| **User** | YALNIZ özünün/komandasının layihə tapşırıqları |

### User arxiv UI
```
┌─ 📦 ARXİV (Mənim tapşırıqlarım) ───────────────┐
│ 🔍 Axtarış: [____________]                      │
│ Filter: [İl] [Layihə]                           │
├─────────────────────────────────────────────────┤
│ 📋 Tapşırıqlar (24)                             │
│   ▸ Bilgə Qrup — Konsept (yan 2025)            │
│ ❌ Müştəri/maliyyə görünmür                     │
└─────────────────────────────────────────────────┘
```

### Admin arxiv UI
```
┌─ 📦 ARXİV (Tam) ────────────────────────────────┐
│ Filter: [Hər şey] [Layihə] [Müştəri] [Tapşırıq] │
│        [Sənəd] [Maliyyə]                        │
│ İl: [2024] [2025] [2026]                        │
├─────────────────────────────────────────────────┤
│ 🏗️ Layihələr (47) | 👥 Müştərilər (12)         │
│ 📋 Tapşırıqlar (340) | 📂 Sənədlər (180)        │
│ Hər qeyd: [Bərpa et] [Bax] [Export]             │
└─────────────────────────────────────────────────┘
```

### Avtomatik arxivləmə
| Obyekt | Qayda |
|--------|-------|
| Layihə | Tamamlandı + closeout 6 ay sonra |
| Müştəri | Son layihə 12 ay+ keçmişdə |
| Tapşırıq | Layihə arxivləndikdə avto |

### Saxlama
- **Arxiv silinmir** (default)
- Silmə qaydası tətbiq olunsa → **1 ay öncə** export linki avtomatik göndərilir

### RLS
```sql
create policy "user_archive_tasks_only" on tasks
for select using (
  archived_at is not null AND 
  (
    is_admin() OR 
    auth.uid() = ANY(assignee_ids)
  )
);
```

---

## 8️⃣ AKTİVLİK LOG — Trello-style

### Hər tapşırıqda Activity tab
```
📜 AKTİVLİK
─────────────────────────────────────────────
🟢 03 May 14:30 — Talifa: status "Başlanmayıb" → "İcrada"
💬 03 May 14:25 — Aydan: "@turkan klientdən cavab gözlədik"
✏️ 02 May 18:00 — Talifa: deadline 12 May → 15 May
👤 02 May 09:15 — Talifa: assignee Aydan əlavə etdi
📎 01 May 11:00 — Aydan: "konsept_v2.pdf" əlavə etdi
✅ 01 May 09:00 — Aydan: subtask "Mass plan" tamamlandı
🆕 28 Apr 14:00 — Talifa: tapşırıq yaratdı
```

### Universal DB schema
```sql
create table activity_log (
  id uuid primary key,
  entity_type text,      -- task|project|client|outsource_item|invoice|...
  entity_id uuid,
  user_id uuid references profiles(id),
  action text,           -- created|updated|deleted|commented|status_changed|assigned|...
  field_name text,
  old_value text,
  new_value text,
  metadata jsonb,
  is_blame_excluded boolean default false,
  created_at timestamptz default now()
);
```

### Tracked actions (audit C9 fix)
- ✅ Status dəyişdi
- ✅ Assignee dəyişdi
- ✅ Priority dəyişdi
- ✅ Deadline dəyişdi
- ✅ Description dəyişdi
- ✅ Subtask əlavə/sil/tamamlandı
- ✅ Şərh yazıldı (mention dəxi daxil)
- ✅ Fayl əlavə olundu
- ✅ Outsource əlavə/dəyişdi
- ✅ Tapşırıq yaradıldı/silindi/arxivləndi

### Performansa təsir filtri
**📊 PM:**
> *"Gecikmənin səbəbi sifarişçi olsa, bu işçinin performansına mənfi təsir göstərməməlidir"*

**Necə işləyir:**
1. Admin manual `is_blame_excluded=true` işarələyə bilər
2. **MIRAI avtomatik aşkar edir:** Şərhlərdə açar sözlər
   - *"sifarişçi gecikdirdi"*, *"müştəri cavab vermir"*, *"outsource gecikdi"*
   → MIRAI flag təklif edir → admin təsdiqləyir
3. Performance hesablamasında `is_blame_excluded=true` olan delay-lər istisna

### MIRAI öyrənmə nümunəsi
```
🤖 MIRAI HR — Aydan üçün ay yekun analizi:

Bu ay 5 tapşırıq deadline-dan keçib, AMMA:
  ✓ 3-ü "sifarişçi gecikdi" kateqoriyasında (excluded)
  ✓ 1-i outsource Tek-Strukt-un günahı (excluded)
  ✗ Yalnız 1-i Aydanın özü ilə bağlı

Yenidən hesablanmış score: 92/100 (yüksək)
```

---

## 🔔 BİLDİRİŞLƏR — Tam siyahı

### Avtomatik (event-əsaslı)
| Bildiriş | Kimə |
|----------|------|
| 📅 Deadline yaxınlaşır (2 gün, 1 gün, axşam) | Cavabdeh + admin |
| ⚠️ Deadline keçdi | Cavabdeh + admin |
| 🤝 Outsource təsdiqlədi | **Layihənin cavabdeh adminləri** |
| 🤝 Outsource gecikdi | **Layihənin cavabdeh adminləri** |
| 💬 **Mention** (`@kimisə`) | Etiketlənən şəxs (real-time) |
| 📊 Aylıq performans | Adminlər (1-i hər ay) |
| 🏆 Layihə tamamlandı | Komanda |
| 🆕 Yeni assignee | Etiketlənən şəxs |
| 🔄 Status dəyişdi | Cavabdeh + watcher-lər |

### Schedule-əsaslı (yeni)

#### 🌅 09:00 — Günün özeti (hər kəsə)
```
🌅 Sabahınız xeyir, Aydan!

📋 Bu gün tapşırıqlarınız (3):
   • Bilgə Qrup — Eskiz təqdimatı (deadline: bu gün!)
   • Hacıkənd — Konsept icmal (deadline: cüm)
   • Yay evi — outsource cavabı gözlənilir

📅 Görüşləriniz (1):
   • 14:00 — Talifa ilə həftəlik review

✨ Motivasiya:
"Memarlıq icra olunmuş ideyaların qalıb gedən izidir."
— Frank Lloyd Wright

Sizə uğurlu gün arzulayırıq! 🎯
```

#### 🌙 18:00 — Motivasiya mesajı (hər kəsə)
```
🌙 Yaxşı işləmisiniz, Aydan!

Bugünkü nəticələriniz:
   ✅ 2 tapşırıq tamamlandı
   ✅ 4 subtask qapandı
   💬 8 şərh yazdınız

✨ Düşünmək üçün:
"Sadəlik mürəkkəbliyin ən yüksək formasıdır."
— Leonardo da Vinci

İndi istirahət edin — sabah yenidən! 🌟
```

### Mention izahı
İstifadəçi şərhdə `@aydan` yazanda:
- Aydan dərhal bildiriş alır (toast)
- Telegram bildirişi (əgər bağlıdırsa)
- "Mənim mention-larım" tab-ında saxlanır
- Aktivlik log-a yazılır

### MIRAI Smart Reminder
Saatlıq batch:
```
🤖 MIRAI: "Aydan, sənin Bilgə Qrup tapşırığın
sabah deadline-da. Estimated 2 həftə idi, 
indi 13 gün keçib. Yetişəcəkmi?"
```

### DB schema (notifications)
```sql
create table scheduled_notifications (
  id uuid primary key,
  schedule_type text,  -- 'daily_morning'|'daily_evening'|'mention'|'event'
  schedule_time time,  -- 09:00 / 18:00
  enabled boolean default true,
  user_id uuid,        -- null = hər kəsə
  template jsonb       -- {text_template, motivation_quote_source}
);

create table user_notification_settings (
  user_id uuid primary key,
  morning_summary boolean default true,
  evening_motivation boolean default true,
  telegram_chat_id text,
  email_enabled boolean default true
);
```

---

## 🎨 SƏHİFƏ DİZAYNI — 3 Görünüş (Calendar AYRI page-də)

### A) Kanban (mövcud + yeniliklər)
- Sütunlar: İdeyalar / Başlanmayıb / İcrada / Yoxlamada / Ekspertizada / Tamamlandı
- Drag-drop (mövcud, position saxlanır — C7 fix)
- Subtask warning (A4 fix)
- Hər card-da subtask sayğacı: "3/8 ☐"

### B) Cədvəl (yeni)
- Sütunlar: Ad, Layihə, Cavabdeh, Deadline, Müddət, Status, Outsource
- Sort/filter
- Bulk actions

### C) "Mənim Tapşırıqlarım" (yeni)
- Yalnız mənə təyin olunan
- "Bu gün", "Bu həftə", "Gecikənlər" tab-ları
- Quick "Tamamla" düyməsi

### ❌ Calendar — TAPŞIRIQLAR PAGE-DƏ YOXDUR
- Calendar artıq ayrı page kimi mövcuddur (Hadisələr Təqvimi)
- Sonradan o səhifə təkmilləşdiriləcək — focus deyil

---

## 🚨 PRIVACY QAYDASI

```
🔒 USER PRIVACY RULE
─────────────────────
User-lər (memarlar) görməməlidir:
- Heç bir məbləğ (₼)
- Heç bir maaş məlumatı
- Heç bir budget/forecast
- Heç bir gəlir/xərc
- Outsource paid status (yalnız operational)

User-lər görür:
- Tapşırıqlar
- Layihə adları + deadlines
- Komanda üzvləri
- Outsource: ad, contact, deadline, status (paid yox!)

MIRAI Chief Architect:
- Yalnız memarlıq sualları
- Pul sualına satirik rədd
```

### RLS implementasiya
```sql
create view outsource_user_view as
select 
  id, project_id, work_title, contact_person, contact_company, 
  responsible_user_id, deadline, status, cancel_reason
  -- amount, paid_at, payment_method QASITLI ATILIR
from outsource_items;
```

---

## 📅 İCRA PLANI — 5-6 həftə

| # | Modul | Vaxt |
|---|---|---|
| 1 | DB schema + Migration (zero-loss verifikasiya) | 2 gün |
| 2 | Status modeli + Cancelled flow | 1 gün |
| 3 | Hierarxiya: Card-Task-Subtask UI | 2 gün |
| 4 | Auto Task Planner + Asılılıq | 4 gün |
| 5 | **Ekspertiza Auto-Subtasks + Backward Planning** | **3 gün** |
| 6 | Outsource Privacy filter (user view) | 2 gün |
| 7 | Smart Closeout (redaktə oluna bilən) | 2 gün |
| 8 | Portfolio Workflow + Custom awards | 3 gün |
| 9 | Arxiv (rol-əsaslı, RLS) | 3 gün |
| 10 | **Aktivlik Log (universal, MIRAI-feed)** | **4 gün** |
| 11 | Bildirişlər (event + 09:00 + 18:00) | 3 gün |
| 12 | 3 görünüş (Kanban + Cədvəl + Mənim) | 2 gün |
| 13 | MIRAI Privacy Filter + blame-exclude | 2 gün |
| 14 | Display Parity audit + Data Migration test | 2 gün |

**Cəmi: ~35 iş günü = 6-7 həftə**

---

## 🚩 RİSKLƏR

1. **Status genişlənməsi (7 status)** — Trello 3-4 ilə razıdır
   - **User feedback ilə bu artıq qəbul olundu** (memarlıq sahəsi spesifikdir, ekspertiza ayrı status lazımdır)

2. **Asılılıq zəncirləri qarışıq olar** — 5+ tapşırıq bir-birinə bağlı
   - **Tövsiyəm:** Vizual Gantt-light view (sonra), indi sadəcə text dependency

3. **MIRAI privacy filter overprotection** — bəzi sualları səhv blok edə bilər
   - **Tövsiyəm:** Whitelist sahə-spesifik suallar (material qiyməti, normativ sayıları və s.)

4. **Activity log böyüməsi** — 1 ildə 100,000+ qeyd
   - **Razı:** 12 ay-dan köhnə log-lar archive table-a köç

5. **Auto Planner ilk dövrdə yanılır**
   - **Razı:** Memarlar AI tövsiyəsini "təsdiq" edir → MIRAI öyrənir → 3 ay sonra avtomatik

---

## ✅ FINAL DECISIONS

- Status: 7 mərhələ (ekspertizada daxil)
- Hierarxiya: Card → Task → Subtask (3 səviyyə)
- Auto Planner ekspertiza-aware (ekspertiza subtask-ları default əlavə)
- Backward planning: müqavilə bitməsindən 7-10 gün öncə ekspertiza son təsdiq
- Proposal hesablamasında ekspertiza vaxtı daxil
- Outsource icraçısı sonra təyin oluna bilər
- Müddət: gün/həftə (saat YOX, timesheet YOX)
- User-lər pul/maaş/budget GÖRMƏMƏLİDİR
- MIRAI satirik rədd pul suallarında
- Closeout checklist: redaktə + sil + əlavə
- Portfolio: sistem + custom awards
- Arxiv: admin hər şey, user yalnız tapşırıq
- Activity log universal (Trello-like)
- Blame-exclude: sifarişçi gecikmələri performansa təsir göstərmir
- Mention = @kimisə real-time
- Outsource bildirişləri: layihənin cavabdeh adminləri
- **09:00 günün özeti + tapşırıqlar + görüşlər + motivasiya**
- **18:00 motivasiya konteksti mesaj**
- **Calendar AYRI page-də qalır (focus burada deyil)**
- **🚨 ZERO DATA LOSS — bütün məlumat tam dəqiqliyi ilə köçürülür**
