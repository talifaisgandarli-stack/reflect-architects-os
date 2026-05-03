## MAXİMUM TƏHLÜKƏSİZLİK — İŞ PROTOKOLU

### Supabase RLS (Row Level Security)
- Hər cədvəldə RLS **məcburi aktiv** — heç vaxt `ALTER TABLE x DISABLE ROW LEVEL SECURITY`
- Policy-lər `auth.uid()` + `roles.level` əsasında — `authenticated` roluna ümumi icazə QADAĞANDIR
- İşçilər maliyyə cədvəllərinə (`incomes`, `expenses`, `salaries`, `debitor_borclar`) **heç bir şərt altında** `SELECT` edə bilməz
- Hər yeni cədvəl üçün policy yazılmadan deploy edilmir

### API (`/api/*`)
- Hər endpoint `Authorization: Bearer <supabase_token>` yoxlayır
- Token doğrulama serverda — client-side yoxlama **yetərsizdir, əsas sayılmır**
- `ADMIN_EMAILS` hardcode silinir — rol DB-dən yoxlanır
- Rate limiting hər endpoint-də: `100 req/min` admin, `30 req/min` user
- Input sanitization — bütün user input-larında (SQL injection, XSS)

### Frontend
- Sidebar gizlətmə UI qoruması DEYİL — hər komponentdə rol yoxlaması məcburidir
- Maliyyə rəqəmləri yalnız admin `roleLevel ≤ 2` olduqda render edilir
- `console.log` istehsalda məlumat sızdırmamalıdır — build-da silinir
- Environment variable-lar `VITE_` prefixi ilə — secret-lər heç vaxt frontend-ə getmir

### MIRAI / AI
- MIRAI tool-ları yalnız cari istifadəçinin səlahiyyət çərçivəsini oxuyur
- User MIRAI vasitəsilə admin dataya çata bilməz — privacy filter DB səviyyəsindədir, yalnız UI deyil
- Claude API key server-side (`/api`-də) — client heç vaxt görməz
- Hər MIRAI cavabında `user_id` log-a yazılır (audit trail)

### Məlumat İfşası
- Error message-lər istifadəçiyə DB strukturunu açmamalıdır — generic xəta mesajları
- Stack trace production-da görsənmir
- Telegram mesajlarında maliyyə rəqəmi yalnız admin chat-a gedir

### Ümumi Qaydalar
- Heç bir secret `.env`-dən koda yazılmır
- Dependency-lər mütəmadi yenilənir (npm audit)
- Hər yeni feature üçün: "bu data kimin üçündür, başqası görə bilərmi?" sualı verilir

---

**Qısa qayda:** Hər yazdığımız kodda düşünürük — *bu datanı görməməli olan biri görə bilərmi?* Cavab "bəli" olarsa — düzəltmədən deploy edilmir.
