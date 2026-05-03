# 🏛️ REFLECT ARCHITECTS OS — PLATFORM FINAL DECISIONS

> **Status:** Approved (2026-05-03)
> **Session:** Strategic review + architecture + design system
> **Scope:** Navigation, permissions, design system, feature decisions, missing items

---

## 1️⃣ NAVİQASİYA — FINAL STRUKTUR

```
── İŞ
   ├── Dashboard          (admin/user fərqli)
   ├── Layihələr
   ├── Tapşırıqlar
   ├── Arxiv              ← İş qrupunda (Sistem-də deyil)
   └── Podrat İşləri

── MÜŞTƏRİLƏR            (admin only)
   └── Müştərilər         (Pipeline + Cədvəl + Detail — 3 view, 1 page)

── MALİYYƏ MƏRKƏZİ       (admin only)
   └── Maliyyə Mərkəzi    (tabs: Cash Cockpit / P&L / Outsource / Xərclər / Debitor / Forecast)

── KOMANDA
   ├── İşçi Heyəti
   ├── Əmək Haqqı
   ├── Performans
   ├── Məzuniyyət
   ├── Təqvim             (adı "Hadisələr Təqvimi"dən "Təqvim"ə dəyişdi)
   ├── Elanlar
   └── Avadanlıq

── ŞİRKƏT
   ├── OKR
   ├── Karyera Strukturu
   └── Məzmun Planlaması  (admin only)

── SİSTEM                 (admin only)
   └── Parametrlər
       ├── Ümumi
       ├── Şablonlar
       ├── Bilik Bazası   ← köhnə Qaynaqlar + MIRAI RAG PDF-ləri
       └── Bildirişlər
```

### Silinən səhifələr
- **Sənəd Arxivi** — Müştəri Lifecycle-a (`project_documents`) köçdü. Ayrı nav item silinir. Köhnə data miqrasiya olunur.
- **Qaynaqlar** — MIRAI RAG üstləndi. Parametrlər → Bilik Bazası tab-ına çevrildi.

---

## 2️⃣ ADMIN / USER PERMISSION MATRİX

| Səhifə | Admin | User |
|---|---|---|
| Dashboard | Tam (P&L, team, pipeline) | Sadə (öz tapşırıqları, layihələri) |
| Layihələr | Bütün + maliyyə | Öz layihələri (maliyyəsiz) |
| Tapşırıqlar | Bütün | Öz + komanda tapşırıqları |
| Arxiv | Hər şey | Yalnız öz tapşırıqları |
| Podrat İşləri | Tam (məbləğ daxil) | Operational (məbləğsiz) |
| Müştərilər | Tam | Gizli |
| Maliyyə Mərkəzi | Tam | Gizli |
| İşçi Heyəti | Tam CRUD | Read-only (komanda siyahısı) |
| Əmək Haqqı | Bütün işçilərin | Yalnız öz maaşı |
| Performans | Bütün komanda | Yalnız özünün (bütün illər) |
| Məzuniyyət | Bütün cədvəl + təsdiq | Öz sorğusu + komanda cədvəli |
| Təqvim | Bütün hadisələr | Bütün hadisələr |
| Elanlar | CRUD | Read |
| Avadanlıq | Tam | Read (öz avadanlığı) |
| OKR | Şirkət OKR + bütün komanda OKR | Yalnız öz personal OKR |
| Karyera Strukturu | Edit (tam hierarxiya) | Read-only (hierarxiya + öz vəzifəsinə çatma yolu) |
| Məzmun Planlaması | Tam | Gizli |
| Parametrlər | Tam | Gizli |

### Performans xüsusi qayda
- 2026-dan əvvəl: sistem tracking yox idi → boş state göstərilir ("Bu il üçün məlumat yoxdur")
- 2026-dan: tam tracking (admin + user daxil — admin-in özünün də performansı izlənir)
- İşçilər yalnız öz balını görür, başqasınınkını görmür
- `is_blame_excluded`: sifarişçi gecikmələri işçi balına təsir etmir

### OKR xüsusi qayda
- Admin: şirkət OKR + bütün komanda OKR-ları
- User: **yalnız öz personal OKR**-u (şirkət OKR-u görmür)

### Karyera Strukturu
- Admin: edit + idarə et
- User: şirkət hierarxiyasını görür + **öz vəzifəsinə çatmaq üçün nə lazımdır** (career path) — motivasiya üçün açıqdır

---

## 3️⃣ DİZAYN SİSTEMİ — ATTİO ÜSLUBİ

### Rəng Palitras (soyuq neytral — Attio-dan götürülmüş)

| Token | Dəyər | İstifadə |
|---|---|---|
| `bg-base` | `#F2F3F7` | Əsas background (dot grid ilə) |
| `bg-surface` | `#FFFFFF` | Cards, panellər |
| `sidebar-bg` | `#1A1D23` | Sol dark sidebar |
| `sidebar-inactive` | `#8B8FA8` | Nav labels |
| `sidebar-active` | `#FFFFFF` | Aktiv nav item |
| `border` | `#E8E9ED` | Bütün border-lər |
| `text-primary` | `#0F1117` | Əsas mətn |
| `text-muted` | `#6B7280` | İkinci dərəcəli mətn |
| `accent` | `#4F6BFB` | CTA, link, aktiv state |
| `income` | `#16A34A` | Gəlir rəqəmləri |
| `expense` | `#DC2626` | Xərc rəqəmləri |
| `warning` | `#D97706` | Forecast risk |
| `dot-color` | `#D1D5E0` | Dot grid nöqtələri |

### Dot Grid Background
```css
background-color: #F2F3F7;
background-image: radial-gradient(circle, #D1D5E0 1px, transparent 1px);
background-size: 20px 20px;
```
Login page, boş state-lər, dashboard arxa fonunda istifadə olunur. Sidebar və white card-larda yoxdur.

### Layout Arxitekturası
- **Sol sidebar:** `220px` expanded / `56px` icon-only collapsed
- **Sidebar style:** Dark (`#1A1D23`), group labels uppercase 10px
- **Main area:** Dot grid bg, white surface cards
- **Record açmaq:** Slide-in panel sağdan (`480px`), yeni səhifəyə keçmir
- **Top bar (admin):** Cash Cockpit sticky — `🏦 ₼X | 💵 ₼X | 📊 ₼X | ⚠️ 90gün: ₼X`
- **MIRAI düyməsi:** Sağ-aşağı, `52px` dairə, `accent` rəng, persona badge

### Typography
```
Font: Inter (mövcud)
Page title:    20px / weight 600 / text-primary
Section head:  13px / weight 500 / UPPERCASE / text-muted / tracking-wide
Table header:  12px / weight 500 / text-muted
Table cell:    13px / weight 400 / text-primary
Sidebar label: 13px / weight 400 / sidebar-inactive (→ white aktiv)
Badge:         11px / weight 500
Numbers (fin): 14px / weight 600 / tabular-nums / right-aligned
```

### Smooth/Polish Animasiyalar
| Element | Spec |
|---|---|
| Bütün keçidlər | `transition: all 150ms ease` |
| Card hover | `transform: translateY(-1px)` |
| Sidebar collapse | `width 200ms ease` |
| Slide-in panel | `transform: translateX(100%)→0`, `300ms ease-out` |
| Skeleton loader | Animated shimmer `#E8E9ED → #F2F3F7` |
| Page load | Skeleton → data fade-in `200ms` |
| Dropdown | `opacity 0→1`, `translateY(-4px→0)`, `150ms` |
| Button press | `transform: scale(0.97)`, `100ms` |
| Toast | Sağ-üst, slide-in, `3s` auto-dismiss |

---

## 4️⃣ SƏHIFƏ-SPESIFIK QƏRARLAR

### Giriş Səhifəsi
- Full screen dot grid background
- Center: white card (`border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.06)`)
- Reflect logo: Inter 800, `#0F1117`, böyük, mərkəzdə
- Subtitle: "Arxitektorlar üçün əməliyyat sistemi." — muted, Inter 400
- Top-right: "Daxil ol →" outline button (hover → filled accent)
- Email input + "Daxil ol" primary button

### Dashboard (hər ikisi — admin + user)
- Greeting: "Sabahınız xeyir, [Ad]! 👋"
- Komanda avatar sırası: Notion-style illustration, 48px dairəvi, online/offline dot, ad altında
- Bugünün görüşləri (Təqvimdən pull)
- Son elanlar: son 3 (MIRAI + manual)
- Admin-da əlavə: maliyyə widget-ləri (user-də yoxdur)

### Performans Səhifəsi
- Gauge chart: `0-40` qırmızı, `40-70` sarı, `70-100` yaşıl
- Altında 3 komponent bar: Task score (40%), 360° survey (30%), Manager (30%)
- 2026-dan əvvəl: boş state "Bu il üçün məlumat yoxdur"

### Təqvim Səhifəsi
- Google Calendar parity: Ay / Həftə / Gün görünüşü
- Email invite: `.ics` fayl + `mailto:` link (server-side-sız işləyir)
- Google Meet: "Meet yarat" düyməsi → `https://meet.new` açır → user linki kopyalayıb əlavə edir
  - *(Gələcəkdə: Google Calendar API OAuth inteqrasiyası)*
- Xarici iştirakçı: email field → `.ics` avtomatik hazır
- Recurring: RFC 5545 RRULE (mövcuddur)
- Multi-day: mövcuddur

### Elanlar Səhifəsi — MIRAI Feed
MIRAI CMO persona həftəlik elan posta bilir:
- **Tip `Trend`:** ArchDaily / Dezeen / Archinect RSS-dən memarlıq meylləri
- **Tip `Opportunity`:** Award / competition deadline-ları (Aga Khan, WAF, Dezeen Awards, Architizer A+, RIBA)
```
MIRAI CMO (həftəlik cron) →
  RSS fetch + award calendar →
  relevance filter (memarlıq + AZ/regional) →
  Elanlar-a post (mirai_generated: true, approved: false) →
  Admin görür → "Yayımla / Rədd et"
```
Admin approve etmədən komandaya görsənmir.

### Karyera Strukturu (user view)
- Şirkət hierarxiyası tam görünür
- User öz vəzifəsini görür (highlighted)
- "Bu vəzifəyə çatmaq üçün:" bölməsi — tələblər, bacarıqlar, timeline

---

## 5️⃣ TELEGRAM — YENİDƏN QURULUR

### Köhnə kod silinir
- Əski Telegram bot kodu (şablon, quru mesajlar) tamamilə silinir
- `telegram_notifications` cədvəli **saxlanır** (data itirilmir)
- Yeni MIRAI-based Telegram arxitekturası sıfırdan yazılır

### Yeni Onboarding Flow (chat_id problemi həlli)
```
Parametrlər → "Telegram" bölməsi →
  [Telegram Bağla] düyməsi →
  Platforma unique token yaradır →
  https://t.me/ReflectBot?start=TOKEN açılır →
  User Telegram-da /start göndərir →
  Bot chat_id alır → API call →
  profiles.telegram_chat_id yazılır →
  Platform "✅ Bağlandı" göstərir
```

---

## 6️⃣ MÖVCUD BOŞLUQLAR (Gələcək Sprint-lərə)

| # | Boşluq | Kritiklik | Sprint |
|---|---|---|---|
| 1 | Timesheet/gün qeydiyyatı UI yoxdur | 🔴 | Sprint 1 (P&L blocker) |
| 2 | Telegram chat_id onboarding | 🔴 | Sprint 1 |
| 3 | Cmd+K universal axtarış | 🟡 | Sprint 2 (Sprint 3-dən çəkildi) |
| 4 | AZDNT PDF yığma (RAG üçün) | 🟡 | Sprint 2 (Talifa manual) |
| 5 | Real-time conflict detection | 🟢 | Sprint 3 |
| 6 | Export/backup UI | 🟢 | Sprint 3 |
| 7 | Mobile touch drag-drop | 🟢 | Sprint 3 |
| 8 | Google Calendar API OAuth | 🟢 | Gələcək |
| 9 | Müştəri portalı (D6) | 🟢 | Gələcək |
| 10 | Portfel → Vebsayt publish | 🟢 | Gələcək |

---

## 7️⃣ KRİTİK QAYDA — ZERO DATA LOSS

> Bütün qərarlar, miqrasiyalar və dəyişikliklər bu qaydaya tabedir:

1. Heç bir cədvəl/sütun silinmir — `RENAME` + view
2. Hər miqrasiyada data parity test (count + sum müqayisə)
3. `up()` + `down()` migration məcburi
4. Deploy öncə `pg_dump` backup avtomatik
5. Vizual Parity Audit: before/after screenshot + istifadəçi təsdiqi

---

## ✅ AUTHOR DECISIONS LOG

| Qərar | Tarix |
|---|---|
| Attio-inspired cool neutral design system | 2026-05-03 |
| Sənəd Arxivi silinir → Müştəri Lifecycle | 2026-05-03 |
| Qaynaqlar silinir → Parametrlər/Bilik Bazası | 2026-05-03 |
| Arxiv İş qrupuna köçür | 2026-05-03 |
| Köhnə Telegram silinir, yenidən qurulur | 2026-05-03 |
| OKR user: yalnız personal OKR | 2026-05-03 |
| Karyera Strukturu: user promotion path görür | 2026-05-03 |
| Performans 2026-dan aktiv (admin daxil) | 2026-05-03 |
| Əmək Haqqı: user öz maaşını görür | 2026-05-03 |
| MIRAI CMO → Elanlar-a trend/opportunity post | 2026-05-03 |
| Təqvim: Google Calendar parity + meet.new | 2026-05-03 |
| Dot grid background (20px, #D1D5E0) | 2026-05-03 |
| Login page: dot grid + center card + logo | 2026-05-03 |
| Dashboard: avatar sıra + görüş + elan widget | 2026-05-03 |
| Performans: gauge chart (2026-dan) | 2026-05-03 |
| Cmd+K Sprint 2-yə çəkildi (Sprint 3-dən) | 2026-05-03 |
| Timesheet UI Sprint 1-ə əlavə edildi | 2026-05-03 |
