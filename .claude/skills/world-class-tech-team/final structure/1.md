Hər nöqtəni ayrıca cavablandırıram:

---

## Düzəlişlər

**Sənəd Arxivi — silinir**
Müştəri Lifecycle-a (`project_documents`) artıq köçdü. Ayrı səhifə redundantdır. Route + nav-dan çıxır. Köhnə data `project_documents`-a miqrasiya olunur.

**Qaynaqlar — silinir**
Köhnə role: normativ kitabxanası + AI. İndi MIRAI RAG həmin funksiyası üstlənir. Qaynaqlar-dakı normativ PDF-lər → Parametrlər → **Bilik Bazası** tabına köçür (admin yalnız AZDNT PDF-lərini oradan yükləyir). Nav-dan silinir.

**OKR — User yalnız öz personal OKR görür.** Şirkət OKR → admin only.

---

## Arxiv yerinin düzəlişi

Arxiv İş qrupuna köçür, Tapşırıqların yanına:

```
── İŞ
   ├── Dashboard
   ├── Layihələr
   ├── Tapşırıqlar
   ├── Arxiv          ← buradadır, Sistem-də deyil
   └── Podrat İşləri
```

Məntiqi: Arxiv = köhnə tapşırıqlar + layihələr. İstifadəçi Tapşırıqlar-dan keçib Arxiv-ə baxır, Sistem-dən deyil.

---

## MIRAI → Elanlar

Bəli, MIRAI CMO persona **Elanlar lövhəsinə** avtomatik post ata bilər.

**İki tip:**
- `Trend` — ArchDaily RSS, dezeen, archinect-dən yeni meyl (həftəlik, MIRAI xülasə edir)
- `Opportunity` — award/competition deadline yaxınlaşır (ArchDaily, Architizer, WAF, Dezeen Awards calendar-ından)

**Mexanizm:**
```
MIRAI CMO (həftəlik cron) →
  RSS fetch (ArchDaily/Dezeen) + award calendar →
  relevance filter (memarlıq + AZ/regional) →
  Elanlar-a post (type: 'mirai_feed', badge: "MIRAI") →
  Admin görür → "Saxla / Rədd et / Paylaş"
```

Admin təsdiq etmədən komandaya görsənmir. Flag: `mirai_generated: true`, `approved: false` → admin approve-dan sonra hamıya görünür.

---

## Təqvim — Google Calendar Parity

**Tələblər:**

| Funksiya | Həll |
|---|---|
| Email invite göndər | `.ics` fayl + `mailto:` link (API-sız işləyir) |
| Google Meet yarat | "Meet yarat" düyməsi → `https://meet.new` açır → istifadəçi linki kopyalayır → hadisəyə əlavə edir |
| Xarici iştirakçı | Email field → hadisə yaradanda `.ics` avtomatik hazır |
| Komanda bildirişi | Platform bildirişi + Telegram |
| Görünüş | Ay / Həftə / Gün (Google Calendar kimi 3 view) |
| Recurring | RFC 5545 (artıq var — `recurrence_rule`) |
| Multi-day | Artıq var |

**Google Meet haqqında kritik qeyd:** Real pre-generated Meet linki üçün Google Calendar API OAuth tələb edir (hər istifadəçinin Google hesabı bağlı olmalıdır). Bu mürəkkəbdir. Tövsiyəm: `meet.new` ilə başla (1 klik → yeni otaq yaradılır), sonrakı versiyada Google Calendar API inteqrasiyası əlavə et. Bu pre-PMF üçün düzgün trade-off-dur.

---

## Attio — Soyuq Neytral Rənglər

| Token | Dəyər |
|---|---|
| `bg-base` | `#F9F9FB` |
| `bg-surface` | `#FFFFFF` |
| `sidebar-bg` | `#111318` |
| `sidebar-text` | `#9CA3AF` (gray-400) |
| `sidebar-active` | `#FFFFFF` |
| `text-primary` | `#111827` (gray-900) |
| `text-muted` | `#6B7280` (gray-500) |
| `border` | `#E5E7EB` (gray-200) |
| `accent` | `#4F46E5` (indigo-600) |
| `income` | `#16A34A` |
| `expense` | `#DC2626` |
| `warning` | `#D97706` |

---

## Final Nav Struktur

```
── İŞ
   ├── Dashboard          (admin/user fərqli)
   ├── Layihələr          (admin: maliyyə; user: maliyyəsiz)
   ├── Tapşırıqlar
   ├── Arxiv              (admin: hər şey; user: öz tapşırıqları)
   └── Podrat İşləri      (admin: məbləğ; user: operational)

── MÜŞTƏRİLƏR            (admin only)
   └── Müştərilər

── MALİYYƏ MƏRKƏZİ       (admin only)
   └── Maliyyə Mərkəzi

── KOMANDA
   ├── İşçi Heyəti
   ├── Əmək Haqqı         (admin: hamı; user: öz maaşı)
   ├── Performans         (admin: hamı; user: özü, bütün illər)
   ├── Məzuniyyət
   ├── Təqvim
   ├── Elanlar            (MIRAI + manual postlar)
   └── Avadanlıq

── ŞİRKƏT
   ├── OKR                (admin: şirkət+hamı; user: yalnız özü)
   ├── Karyera Strukturu  (admin: edit; user: read + promotion yolu)
   └── Məzmun Planlaması  (admin only)

── SİSTEM                 (admin only)
   └── Parametrlər
       ├── Ümumi
       ├── Şablonlar
       ├── Bilik Bazası   ← köhnə Qaynaqlar + MIRAI RAG PDFləri
       └── Bildirişlər
```

**Silinənlər:** Sənəd Arxivi, Qaynaqlar (ayrı nav item kimi).
**Köçürülənlər:** Arxiv → İŞ qrupu; Qaynaqlar → Parametrlər/Bilik Bazası.
