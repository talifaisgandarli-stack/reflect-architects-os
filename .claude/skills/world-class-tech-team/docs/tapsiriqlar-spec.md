# 📋 TAPŞIRIQLAR + SMART CLOSEOUT + ARXİV — FINAL SPEC

> **Status:** Approved (2026-05-03)
> **Stage:** Pre-PMF → Scaling
> **Goal:** Memarlıq sahəsi üçün ağıllı task management + closeout + arxiv

---

## 🏛️ ARXİTEKTURA — 8 modul

```
┌─────────────────────────────────────────────────────┐
│  📋 TAPŞIRIQLAR (Kanban + Cədvəl + Calendar + Mənim)│
└─────────────────────────────────────────────────────┘
       │
       ├── 1. Tapşırıq Modeli (yeni statuslar)
       ├── 2. Auto Task Planner (asılılıq + risk buffer)
       ├── 3. Müddət (gün/həftə — saat YOX)
       ├── 4. Outsource bağlantı (privacy aware)
       ├── 5. Smart Closeout (redaktə oluna bilən)
       ├── 6. Portfolio Workflow (custom awards)
       ├── 7. Arxiv Sistemi (rol-əsaslı)
       ├── 8. Aktivlik Log (Trello-like, MIRAI-feed)

🚨 Privacy: User-lər pul/maaş/budget GÖRMƏMƏLİDİR
```

---

## 1️⃣ TAPŞIRIQ STATUS MODELİ

```
İdeyalar → Başlanmayıb → İcrada → Yoxlamada → Ekspertizada → Tamamlandı → Portfolio
                                                                  ↓
                                                              Cancelled
```

| Status | Mənası |
|--------|--------|
| **İdeyalar** | Düşünülür, hələ planlanmayıb |
| **Başlanmayıb** | Planlandı, icra başlamayıb |
| **İcrada** | Aktiv iş gedir |
| **Yoxlamada** | Daxili keyfiyyət yoxlaması |
| **Ekspertizada** | Xarici ekspertiza / dövlət təsdiqi |
| **Tamamlandı** | Bitdi → Portfolio workflow başlayır |
| **Cancelled** | Ləğv edildi (səbəb məcburi) |

### Cancelled səbəbi
```
○ Müştəri imtina etdi
○ Layihə dəyişdi
○ Texniki problem
○ Yenidən planlaşdırılır
○ Digər: ______
```

### DB
```sql
alter table tasks 
  alter column status type text,
  -- enum: ideas|not_started|in_progress|review|expertise|completed|cancelled
  add column cancelled_reason text,
  add column dependency_task_id uuid references tasks(id);
```

---

## 2️⃣ AUTO TASK PLANNER — Çevik model

### Memar input-u (sadə)
```
İş adı: Konstruksiya hesablaması
Outsource? ☑ Bəli  ☐ Xeyr
Outsource icraçısı: [boş qala bilər]
Asılılıq: [Eskiz layihə bitməlidir]
Estimated müddət: 2 [həftə ▼]
```

### MIRAI hesablama
```
Estimated duration: 2 həftə
Outsource buffer: +30% (gecikmə riski)
Real planlama: 2.6 həftə
Auto start_date: Eskiz bitməsindən sonra
Auto deadline: 24 İyun
```

### Asılılıq (dependency)
- Tapşırıq B → Tapşırıq A asılıdır
- A bitməsə B-nin status `in_progress`-ə keçməsi blok olunur
- A-nın deadline dəyişəndə B avtomatik yenilənir
- MIRAI gecikmə zəncirini görsətər

### Stage template-ləri (Şablon Mərkəzində)
**Tipik mərhələlər (Talifa redaktə edə bilər):**
- **Yaşayış evi:** Konsept (2h) → Eskiz (3h) → İşçi (4h) → Müəllif (5h)
- **Kommersiya:** Konsept (3h) → Eskiz (5h) → İşçi (7h) → Müəllif (4h)
- **İnteryer:** Konsept (1h) → 3D (2h) → İşçi (3h) → Müəllif (2h)
- **Şəhərsalma:** Konsept (3h) → Master plan (6h) → Detallar (10h) → Müəllif (4h)

(*h burada həftə deməkdir*)

### DB
```sql
alter table tasks add column
  start_date date,
  estimated_duration_days int,
  duration_unit text default 'days',  -- 'days'|'weeks'
  risk_buffer_pct int default 0,      -- outsource üçün 30
  workload_calculated_at timestamptz;
```

---

## 3️⃣ MÜDDƏT — Gün/Həftə (saat YOX)

**📊 PM qaydası:**
- Saat qeydi etmək hamını çaşdırır + əlavə iş yükü yaradır
- Hər tapşırıqda **estimated duration**: gün və ya həftə
- **Actual duration** avtomatik: `completed_at - start_date`
- Timesheet **YOXDUR** — overhead allocation `tasks.actual_duration` əsasında

### Layihə P&L hesablama (Maliyyə spec ilə əlaqə)
```sql
-- Hər istifadəçinin layihəyə "ayırdığı vaxt"
sum(task.actual_duration_days × user.daily_rate) per project
-- Bu Reflect-in "internal cost"-udur, P&L-da overhead kimi gəlir
```

---

## 4️⃣ OUTSOURCE BAĞLANTISI — Privacy Aware

### Tapşırıqda görsənənlər (User üçün)
```
☑ Outsource: Konstruksiya hesablaması
   Contact person: Elnur (Tek-Strukt MMC)
   Cavabdeh şəxs: Aydan (komanda)
   Deadline: 15 May
   Status: Pending / Done / Cancelled
```

### Tapşırıqda GÖRSƏNMƏYƏNLƏR
- ❌ `paid` status
- ❌ `amount`
- ❌ `payment_method`
- ❌ Hər hansı maliyyə məlumatı

### Yer ayrılığı
- **Tapşırıqlarda:** operational (kim, nə, vaxt)
- **Maliyyə Mərkəzində (admin only):** finansial (məbləğ, status, ödəniş)

### MIRAI privacy filter (kritik!)
User pul/budget/maaş ilə bağlı sual verəndə:

> *"Hörmətli istifadəçi, maliyyə məlumatlarımız korporativ məxfilik qaydalarımıza tabedir — Reflect-də belə suallar etik sayılmır 😊 Sahə eksperti kimi memarlıq sualınız varsa, məmnuniyyətlə cavablandırım!"*

**Tone:** Mədəni + yüngül satirik. Utandırmadan amma aydın.

```js
// MIRAI implementation
const MONEY_KEYWORDS = ['pul', 'maaş', 'budjet', 'gəlir', 'xərc', 'qazanc', 
                       'zərər', 'odenis', 'ödəniş', 'bonus', 'borc', 'salary',
                       'income', 'expense', 'profit'];

if (user.role === 'user' && hasMoneyKeyword(query)) {
  return POLITE_REJECTION_RESPONSE;
}
```

---

## 5️⃣ SMART CLOSEOUT — Redaktə oluna bilən checklist

### Layihə "Tamamlandı"-ya keçəndə avtomatik açılır
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

### Edit / Add features
- Hər checklist item silinə bilər
- Yeni item əlavə oluna bilər
- Default 3 məcburi qalır (admin tərəfindən sabit)
- Custom item-lər istənilən vaxt əlavə

### DB
```sql
create table closeout_checklists (
  id uuid primary key,
  project_id uuid references projects(id),
  items jsonb,  -- [{label, checked, is_default, can_delete}, ...]
  closed_at timestamptz,
  closed_by uuid references profiles(id)
);
```

---

## 6️⃣ PORTFOLIO WORKFLOW — Custom Awards

### Açılır əgər "Portfolio namizədi: Bəli" seçildi

```
🏆 PORTFOLIO HAZIRLIĞI
──────────────────────
Checklist (redaktə edilə bilər):
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
create table portfolio_workflows (
  id uuid primary key,
  project_id uuid references projects(id),
  checklist_items jsonb,
  selected_awards jsonb,  -- [{name, source: 'system'|'custom'}, ...]
  website_publish_date date,
  press_release_planned boolean,
  status text default 'draft'  -- draft|active|published
);

create table system_awards (
  id uuid primary key,
  name text,
  region text,
  category text,
  application_url text,
  deadline_month int  -- yıllıq deadline
);
```

### MIRAI tövsiyəsi
> *"Bu layihə MIPIM-ə uyğundur (memarlıq + sustainability). 
> Deadline: 30 Sentyabr. Tövsiyə edirəm namizədliyi indi rezerv edin."*

---

## 7️⃣ ARXİV SİSTEMİ — Rol-əsaslı access

### Access qaydası
| Rol | Arxivdə görünən |
|-----|-----------------|
| **Admin** | Hər şey: layihə, müştəri, tapşırıq, sənəd, maliyyə |
| **User** | YALNIZ özünün/komandasının layihə tapşırıqları |

### User üçün arxiv UI
```
┌─ 📦 ARXİV (Mənim tapşırıqlarım) ───────────────┐
│                                                 │
│ 🔍 Axtarış: [____________]                      │
│ Filter: [İl] [Layihə]                           │
│                                                 │
├─────────────────────────────────────────────────┤
│ 📋 Tapşırıqlar (24)                             │
│   ▸ Bilgə Qrup — Konsept (yan 2025)            │
│   ▸ Karyera — Eskiz (dek 2024)                 │
│                                                 │
│ ❌ Müştəri/maliyyə görünmür                     │
└─────────────────────────────────────────────────┘
```

### Admin üçün arxiv UI
```
┌─ 📦 ARXİV (Tam) ────────────────────────────────┐
│ Filter: [Hər şey] [Layihə] [Müştəri] [Tapşırıq] │
│        [Sənəd] [Maliyyə]                        │
│ İl: [2024] [2025] [2026]                        │
├─────────────────────────────────────────────────┤
│ 🏗️ Layihələr (47)                              │
│ 👥 Müştərilər (12)                              │
│ 📋 Tapşırıqlar (340)                            │
│ 📂 Sənədlər (180)                               │
│                                                 │
│ Hər qeyd: [Bərpa et] [Bax] [Export]             │
└─────────────────────────────────────────────────┘
```

### Avtomatik arxivləmə qaydaları
| Obyekt | Qayda |
|--------|-------|
| Layihə | Tamamlandı + closeout 6 ay sonra |
| Müştəri | Son layihə 12 ay+ keçmişdə |
| Tapşırıq | Layihə arxivləndikdə avto |

### Saxlama
- Arxiv silinmir (default)
- Silmə qaydası tətbiq olunsa → 1 ay öncə export linki avtomatik
- RLS rolları access enforce edir

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

## 8️⃣ AKTİVLİK LOG — Trello-style, MIRAI-feed

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

### Universal DB schema (bütün modullar üçün)
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

create index idx_activity_entity on activity_log(entity_type, entity_id);
create index idx_activity_user on activity_log(user_id);
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

### Performansa təsir filtri (kritik qayda)
**📊 PM:**
> *"Gecikmənin səbəbi sifarişçi olsa, bu işçinin performansına mənfi təsir göstərməməlidir"*

**Necə işləyir:**
1. Admin manual `is_blame_excluded=true` işarələyə bilər (hər activity-də)
2. **MIRAI avtomatik aşkar edir:** Şərhlərdə açar sözlər
   - *"sifarişçi gecikdirdi"*
   - *"müştəri cavab vermir"*
   - *"outsource gecikdi"*
   - *"client delay"*, *"customer not responding"*
   → MIRAI flag təklif edir → admin təsdiqləyir
3. Performance hesablamasında `is_blame_excluded=true` olan delay-lər istisna

### MIRAI öyrənmə nümunəsi
```
🤖 MIRAI HR — Aydan üçün ay yekun analizi:

Bu ay 5 tapşırıq deadline-dan keçib, AMMA:
  ✓ 3-ü "sifarişçi gecikdi" kateqoriyasında (excluded)
  ✓ 1-i outsource Tek-Strukt-un günahı (excluded)
  ✗ Yalnız 1-i Aydanın özü ilə bağlı

Reallıqda Aydan əla işləyir.
Yenidən hesablanmış score: 92/100 (yüksək)

💡 Komanda yığıncağında qeyd etməyə dəyər: 
   sifarişçi gecikmələri kommunikasiya təlimatlarımızı 
   yenidən baxmağı tələb edir.
```

---

## 🔔 BİLDİRİŞLƏR — Düzəldilmiş

### Avtomatik bildirişlər
| Bildiriş | Kimə |
|----------|------|
| 📅 Deadline yaxınlaşır (2 gün, 1 gün, axşam) | Cavabdeh + admin |
| ⚠️ Deadline keçdi | Cavabdeh + admin |
| 🤝 Outsource təsdiqlədi | **Layihənin cavabdeh adminləri** (yalnız) |
| 🤝 Outsource gecikdi | **Layihənin cavabdeh adminləri** (yalnız) |
| 💬 Mention (`@kimisə`) | Etiketlənən şəxs (real-time) |
| 📊 Aylıq performans | Adminlər (1-i hər ay) |
| 🏆 Layihə tamamlandı | Komanda |
| 🆕 Yeni assignee | Etiketlənən şəxs |
| 🔄 Status dəyişdi | Cavabdeh + watcher-lər |

### "Mention" izahı
İstifadəçi şərhdə `@aydan` yazanda:
- Aydan dərhal bildiriş alır
- Toast notification (real-time, browser)
- Telegram (əgər bağlıdırsa)
- "Mənim mention-larım" tab-ında saxlanır

### MIRAI Smart Reminder
Saatlıq batch işi:
```
🤖 MIRAI: "Aydan, sənin Bilgə Qrup tapşırığın
sabah deadline-da. Estimated 2 həftə idi, 
indi 13 gün keçib. Yetişəcəkmi?"
```
İşçi cavab verir → MIRAI admin-ə bildirir.

---

## 🚨 KRİTİK QAYDA — Privacy

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
- Sənədlər (texniki)
- Outsource: ad, contact, deadline, status (paid yox!)

MIRAI Chief Architect:
- Yalnız memarlıq sualları
- Pul sualına satirik rədd
```

### RLS implementasiya
```sql
-- User outsource görür amma "amount" sütunu hidden
create policy "user_outsource_no_money" on outsource_items
for select using (
  is_admin() OR (
    auth.uid() in (
      select responsible_user_id from outsource_items where id = outsource_items.id
    )
  )
);

-- Column-level: user-lərə amount/paid_at sütunları null qaytarır
create view outsource_user_view as
select 
  id, project_id, work_title, contact_person, contact_company, 
  responsible_user_id, deadline, status, cancel_reason
  -- amount, paid_at QASITLI ATILIR
from outsource_items;
```

---

## 📅 İCRA PLANI — 4-5 həftə

| # | Modul | Vaxt |
|---|---|---|
| 1 | DB schema (yeni sahələr + cədvəllər) | 1 gün |
| 2 | Status modeli + Cancelled flow | 1 gün |
| 3 | Auto Task Planner + Asılılıq | 4 gün |
| 4 | Stage template-ləri (Şablon Mərkəzində) | 1 gün |
| 5 | Outsource Privacy filter (user view) | 2 gün |
| 6 | Smart Closeout (redaktə oluna bilən) | 2 gün |
| 7 | Portfolio Workflow + Custom awards | 3 gün |
| 8 | Arxiv (rol-əsaslı, RLS) | 3 gün |
| 9 | **Aktivlik Log (universal, MIRAI-feed)** | **4 gün** |
| 10 | Bildirişlər (Telegram + browser) | 2 gün |
| 11 | 4 görünüş (Kanban + Cədvəl + Calendar + Mənim) | 3 gün |
| 12 | MIRAI Privacy Filter + blame-exclude | 2 gün |
| 13 | Display Parity audit | 1 gün |

**Cəmi: ~29 iş günü = 5-6 həftə**

---

## 🚩 RİSKLƏR

1. **Status genişləməsi** — 7 status (Trello 3-4 ilə razıdır)
   - **Tövsiyəm:** "İdeyalar" backlog-a oxşardır, sıxış mode-da gizlənə bilər (toggle)

2. **Asılılıq (dependency) zəncirləri qarışıq olar** — 5+ tapşırıq bir-birinə bağlı
   - **Tövsiyəm:** Vizual graph görünüşü (Gantt-light), dependency aydın görsənir

3. **MIRAI privacy filter overprotection** — bəzi sualları səhv blok edə bilər (məs: *"Bu materialın qiyməti?"*)
   - **Tövsiyəm:** Whitelist sahə-spesifik suallar (material qiyməti, normativ sayıları və s.)

4. **Activity log böyüməsi** — 1 ildə 100,000+ qeyd
   - **Tövsiyəm:** 12 ay-dan köhnə log-lar archive table-a köç (partition)

5. **Auto Task Planner ilk dövrdə yanılır** — sahə spesifikasını öyrənənə qədər
   - **Tövsiyəm:** Memarlar AI tövsiyəsini "təsdiq" edir → MIRAI öyrənir → 3 ay sonra avtomatik

---

## ✅ AVTHOR DECISIONS LOG

- Status: ideyalar → başlanmayıb → icrada → yoxlamada → ekspertizada → tamamlandı → portfolio
- Cancelled status + məcburi səbəb
- Auto Planner: outsource icraçısı boş qala bilər, sonra təyin olunur
- Asılılıq (dependency) sahəsi əlavə
- Outsource buffer +30%
- Müddət vahidi: gün/həftə (saat YOX)
- Timesheet YOX, actual_duration avtomatik
- User-lər pul/maaş/budget GÖRMƏMƏLİDİR
- Outsource paid status user-də gizli
- MIRAI satirik rədd pul suallarında
- Closeout checklist redaktə + sil + əlavə
- Portfolio: sistem awards + custom awards
- Arxiv: admin hər şey, user yalnız tapşırıq
- Activity log universal (Trello-like), MIRAI-feed
- Blame-exclude: sifarişçi/outsource gecikmələri performansa təsir göstərmir
- Mention = @kimisə real-time
- Outsource bildirişləri: layihənin cavabdeh adminləri (bütün admin yox)
