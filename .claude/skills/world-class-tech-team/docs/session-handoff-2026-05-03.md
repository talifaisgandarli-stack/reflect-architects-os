# 📋 SESSION HANDOFF — 2026-05-03

> **Məqsəd:** Bu fayl növbəti Claude session-u üçün tam kontekst daşıyır.
> Yeni session başlayanda bu faylı oxu, sonra davam et.
> **Layihə:** Reflect Architects OS — Bakı, Azərbaycan memarlıq şirkəti
> **Owner:** Talifa İsgəndərli (founder + admin)

---

## ✅ BU SESSION-DA TAMAMLANANLAR

### Strategik Spec-lər (hamısı approved + GitHub-da)
| Fayl | Məzmun | GitHub |
|---|---|---|
| `maliyye-merkezi-spec.md` | CFO-səviyyə Maliyyə Mərkəzi (7 modul) | ✅ main (PR #21) |
| `musteri-lifecycle-spec.md` | Müştəri CRM + Pipeline + Komunikasiya | ✅ main (PR #22) |
| `tapsiriqlar-spec.md` | Tapşırıqlar v2 + Closeout + Arxiv | ✅ main (PR #22) |
| `mirai-spec.md` | MIRAI Chief AI Officer (6 persona + RAG) | ⚠️ PR #23 açıqdır — merge et |

### Security Fix
- `QaynaqlarPage.jsx` — hardcoded Gemini API key silindi (`AIzaSyD...` — artıq revoke edilib)
- `api/agent.js` — Gemini fallback bloku silindi
- `VITE_ANTHROPIC_API_KEY` Vercel-ə əlavə edildi (Production + Preview, Sensitive ON)
- ✅ main-də (PR #22)

### Author Decisions (Bu Session)
- MIRAI aylıq budget: **$5 USD hard cap** (approved 2026-05-03)
- MIRAI 3 threshold: $4 xəbərdarlıq → $4.50 Groq fallback → $5 stop
- MIRAI 6 persona admin / 1 persona (Chief Architect) user
- Zero Data Loss: heç vaxt DROP TABLE/COLUMN yoxdur
- Privacy: işçilər maliyyə məlumatı görmür (DB + UI səviyyəsində)
- VAT həmişə 18% — DB-də saxlanır, UI-də gizlidir
- Auto Planner ekspertiza buffer: 7-10 gün (müqavilə sonundan əvvəl)
- Groq llama-3.3-70b pulsuz fallback (yalnız $5 limitdə)

---

## 🔴 TAMAMLANMAMIŞ — BUG FIXES (Sprint 1+2 Audit)

QA testi platformada aparıldı. Aşağıdakı bug-lar **hələ düzəldilməyib:**

### Kritik (bloklayır)
| Kod | Bug | Qeyd |
|---|---|---|
| **A1** | Hesab-faktura save xətası — "əməliyyat alınmadı" | C1-i blokur (PDF generasiya işləmir) |
| **A10** | Pipeline stage keçidi sınıq — "Tamamlandı", "İtirildi" save olmur | |
| **C9** | Activity log işləmir | |

### Orta
| Kod | Bug | Qeyd |
|---|---|---|
| **A7** | Nağd ödəniş bloklarının yox olması; VAT save-dən sonra 18%-ə sıfırlanır | |
| **C3** | `supabase is not defined` xətası | Yoxlanılmamış əhatə dairəsi |
| **C5** | Syntax error | Yoxlanılmamış |

### Qeydlər
- A2, A4, A5, A6, A8, A9, B2, B6, B8, C4, C7, C8, C10, C11, C12: Kodda yoxlanıldı, düzgündür
- A5 (B2, B6, C4, C10 daxil) kodda verified → çalışır
- `audit.md` + `auditanswersbyauthor.md` fayllarında tam siyahı var

---

## 🟡 TAMAMLANMAMIŞ — SPEC-LƏR

### D7 — Internal Search (Cmd+K)
**Status:** Spec yazılmayıb
**Nə lazımdır:**
- Cmd+K (Mac) / Ctrl+K (Windows) açır
- Axtarış: layihələr, tapşırıqlar, müştərilər, sənədlər, komanda üzvləri
- Son baxılan items (recent)
- Tez əməliyyatlar (quick actions): "Yeni layihə yarat", "MIRAI aç" və s.
- Fuzzy search (typo-tolerant)
- Klaviatura naviqasiyası (↑↓ Enter Esc)
- RLS: user yalnız öz scope-undakı nəticələri görür
- Texniki: `fuse.js` client-side (DB çağırışı yox, performans üçün)

### Məzuniyyət Subordinasiya Fix
**Status:** Bug tapılıb, spec yazılmayıb, fix edilməyib
**Problem:** Məzuniyyət müraciəti approval routing düzgün işləmir
**Həll:** `profiles.reports_to` sahəsi lazımdır
- Talifa → özü approve edir (founder)
- Türkan → Talifa approve edir
- Digər işçilər → Nicat approve edir (HR)
**DB:** `ALTER TABLE profiles ADD COLUMN reports_to uuid REFERENCES profiles(id);`

---

## 🟠 AÇIQ SUALLAR (Növbəti Sessionda Cavablandır)

### Texniki
1. **Qaynaqlar page xətası** — Gemini silindikdən sonra "xəta baş verdi" deyir. Səbəb: `VITE_ANTHROPIC_API_KEY` browser-expose riski var (security). Həll: `api/` proxy endpoint yaratmaq lazımdır (server-side call). Prioritet: medium.

2. **VITE_ prefix security** — Bütün `VITE_` env vars browser-də görünür. `VITE_ANTHROPIC_API_KEY` risk daşıyır. Bütün AI çağırışları `api/` proxyə köçürülməlidir.

3. **BCC Email Capture** — Resend webhook ilə inbound email → avtomatik platformaya düşür. Spec-də qeyd var (Müştəri Lifecycle), amma texniki implementation detallandırılmayıb. Resend `inbound` feature-u + webhook handler lazımdır.

### Məhsul
4. **Partner Layihələr** — Spec-də qeyd var amma detallandırılmayıb. Sual: partner layihələr ayrı entity-dirmi, yoxsa mövcud `projects` tablosunda `type: partner` sahəsimi? Talifa-dan cavab lazımdır.

5. **Cross-Project Funding Audit Trail** — AZ vergi orqanı üçün PDF qeydi. Maliyyə Mərkəzi spec-də qeyd var. Sual: PDF formatı necə olsun? Canvas signature yetərlimi, yoxsa elektron imza tələb olunur?

6. **RAG Bilik Bazası Doldurulması** — MIRAI spec pgvector + AZ normativlər deyir. Sual: bu sənədlər haradan gəlir? Kim yükləyəcək? Admin panel lazımdır yoxsa manual SQL insert?

7. **Telegram Bot Token** — MIRAI Telegram göndərir. Mövcud bot var? Token Vercel-də set edilib? Yoxsa yeni bot yaratmaq lazımdır?

---

## 📦 SPEC FAYLLARININ YERI

```
.claude/skills/world-class-tech-team/docs/
├── audit.md                    — Sprint 1+2 tam bug siyahısı
├── auditanswersbyauthor.md     — Müəllif qərarları (A1-C12)
├── maliyye-merkezi-spec.md     — ✅ main-də
├── musteri-lifecycle-spec.md   — ✅ main-də
├── tapsiriqlar-spec.md         — ✅ main-də
├── mirai-spec.md               — ⚠️ PR #23 (merge et)
└── session-handoff-2026-05-03.md  — bu fayl
```

---

## 🚀 NÖVBƏTI SESSION ÜÇÜN TONVERSİYA SƏRASİ (Tövsiyə)

**1. Əvvəlcə:** PR #23-ü merge et (MIRAI spec main-ə düşsün)

**2. Bug fixes (kod düzəlişi):**
   - A1 fix → C1 də düzəlir (faktura → PDF)
   - A10 fix (pipeline stage transition)
   - C9 fix (activity log)
   - A7 fix (VAT + nağd ödəniş)

**3. Yeni spec-lər:**
   - D7 Internal Search (Cmd+K)
   - Məzuniyyət Subordinasiya spec + fix

**4. Security:**
   - API çağırışlarını `api/` proxyə köçür (VITE_ risk aradan qaldır)
   - Qaynaqlar page proxy ilə yenidən işləyəcək

**5. MIRAI implementation hazırlığı:**
   - Telegram bot token al
   - Partner layihə sualını cavablandır
   - RAG admin panel qərarı ver

---

## 🗝️ KRİTİK QAYDA XATIRLATMAları (Hər Sessionda Tətbiq Et)

1. **Zero Data Loss** — Heç vaxt `DROP TABLE`, `DROP COLUMN`. Əvəzinə rename + view.
2. **Display Parity** — Köhnə data yeni səhifədə tam görünməlidir.
3. **Privacy Boundary** — User maliyyə məlumatı görməməlidir (DB RLS + UI filtri).
4. **Migrations Reversible** — Hər migration-ın `up()` + `down()` olmalıdır.
5. **MIRAI Write = Approve** — MIRAI heç vaxt avtomatik yazmır, hər write explicit approve tələb edir.
6. **AZ Reallığı** — Azərbaycan qanunvericiliyi, Bakı xüsusiyyətləri hər specdə nəzərə alınır.

---

## 📊 PLATFORM STATUS (2026-05-03)

**Stack:** React + Vite + Supabase + Vercel
**Branch işi:** `claude/pull-main-updates-JcInD`
**Açıq PR-lər:** #23 (MIRAI spec)
**Vercel env vars:** `VITE_ANTHROPIC_API_KEY` (Production + Preview, Sensitive)
**Stage:** Pre-PMF → strateji spec mərhələsi tamamlandı, implementation başlayır
