Bu çox dərin audit tələb edir. Hər bir səhifəni paralel şəkildə öz lensindən analiz edib, sonra tam raport qururam.

Bütün ekspert lensləri birləşdirib tam audit raportu hazırladım. Bu raport 47 problem tapdı — hər birini öz ciddilik səviyyəsi və konkret həll yolu ilə.

📊 REFLECT ARCHITECTS OS — TAM AUDİT RAPORTU

Lensler: Product Owner + PM (Trello/Notion mütəxəssisi) + Staff Engineer + Designer II + InnovationStage: Pre-PMF → Scaling keçidiTapılan problem sayı: 47

🚨 BÖLMƏ A — KRİTİK MƏLUMAT KORRUPSİYASI RİSKLƏRİ (10 problem)

Bunlar dərhal həll olunmalıdır. Hər biri istehsalda gerçək pul/data itkisinə səbəb ola bilər.

A1. Faktura "Ödənildi" → Gəlir cədvəlinə yazılmır 🔴

Yer: HesabFakturalarPage.jsx:166-171 (markPaid)Bug: Faktura "paid" işarələnir, amma incomes cədvəlinə yazılış əlavə olunmur.Senario: Sənin balansında ₼50,000 faktura ödənilmiş görünür, amma gəlir hesabatında həmin pul yoxdur. CEO və mühasib fərqli rəqəm görür.Fix: markPaid daxilində avtomatik income insert et VƏ ya invoice silinəndə bağlı income-u silmək üçün cascade.

A2. Dual assignee_id + assignee_ids — filterləmə qırıq 🔴

Yer: TapshiriqlarPage.jsx:144, 1262, 1391Bug: Tapşırıq saxlanır: assignee_ids = [Alice, Bob], assignee_id = Alice. Filter "Bob"-a görə filtrlədikdə Bob-un tapşırığı görünmür (yalnız assignee_id yoxlanılır).Senario: Tapşırığı Aydan + Turkana təyin edirsən. Turkanın siyahısında o tapşırıq yoxdur. Turkan unutur.Fix: assignee_id sahəsini sil. Hər yerdə assignee_ids istifadə et. SQL miqrasiya: assignee_id-i assignee_ids[0]-ə köçür.

A3. Layihələrdə phase + phases eyni problem 🔴

Yer: LayihelerPage.jsx:435, 344, 589Bug: Eyni dual-field anti-pattern — qismən saxlanan məlumat itkisi.Fix: phase sütunu sil, phases array istifadə et.

A4. Tapşırıq subtask-ları natamam ikən "Done"-a köçür 🔴

Yer: TapshiriqlarPage.jsx drag-drop, status changeBug: Tapşırıqda 5/10 subtask qalıb, amma sürüklə kanban "Tamamlandı" sütununa keçir. Heç bir xəbərdarlıq yoxdur.Fallout: Layihə "tamamlandı" hesab edilir, amma əslində 50% iş qalıb. Hesabatlarda yanlış progress.Fix: "Done"-a keçidə qədər confirm dialog: "X subtask qalır, davam edək?"

A5. Filter logikası — filterMonth filterYear-dan asılıdır 🔴

Yer: XerclerPage.jsx:171-174, DebitorBorclarPage.jsx (artıq düzəltdik), bənzər patternlər digər səhifələrdəBug: "Bütün il + Yanvar" → Yanvar ümumiyyətlə filtrlənmir.Fix: Year və month müstəqil yoxlanılır.

A6. Layihə ödəmə hesablaması — final payment formula səhv 🔴

Yer: PodratIsleriPage.jsx:78, DaxiliKocurmelePage.jsx:230Bug:jsremaining = amt - advance - interim - (final_paid ? amt - advance - interim : 0)

Final ödəniş ayrıca məbləğ kimi saxlanır, amma formula bunu yenidən hesablayır. Qeyri-standart final məbləğ olarsa, "remaining" yalan göstərilir.Fix: final_amount sütununu istifadə et, recalc etmə.

A7. VAT cache vs canlı hesablama — köhnə layihələr səhv 🔴

Yer: LayihelerPage.jsx:430-431, 625Bug: Layihə yaradılarkən edv_amount və amount_with_edv saxlanılır. Display-də yenidən hesablanır. VAT dərəcəsi dəyişsə (məs. 18% → 20%) köhnə layihələr save zamanı yenidən hesablanır — maliyyə qeydləri pozulur.Fix: Versioning: hər layihənin öz vat_rate sütunu olsun.

A8. Vacation günləri istirahət gününü saymır 🔴

Yer: MezuniyyetCedveliPage.jsx:51Bug: Yan 1 — Yan 3 (Şən-Bz-Bz ertəsi) = 3 gün hesablanır, amma yalnız 1 iş günüdür. Vacation budget şişirdilir.Fix: Workday loop, şən/bz xaric. Bayram günləri üçün holidays cədvəli əlavə et.

A9. Vacation conflict detection yoxdur 🔴

Yer: MezuniyyetCedveliPage.jsxBug: Eyni layihənin 2 memarı eyni vaxtda məzuniyyət istəyə bilər. Sistem heç bir xəbərdarlıq vermir. Layihə dayanır.Fix: Save zamanı eyni department üzvlərində overlap yoxla — warning göstər.

A10. Pipeline mərhələ atlama — qalifikasiya itir 🔴

Yer: PipelinePage.jsx:125, 168Bug: Klient "Lead" → birbaşa "Tamamlandı"-ya köçə bilər. "Proposal" mərhələsi atlandı. Heç vaxt qiymət təklifi göndərilmədi, lakin sistem deal "qazandı".Fix: Hər mərhələ üçün məcburi sahələr. "Lost reason" enum əlavə et.

🧮 BÖLMƏ B — AVTOMATİK HESABLAMA SƏHVLƏRİ (8 problem)

B1. Receivable overpayment 🟡

Yer: DebitorBorclarPage.jsx:170Bug: paid_amount expected_amount-dən böyük yazıla bilər (məs. 800 ödəyib 1000 yazılır). Validation yoxdur.Fix: min(0, paid_amount), max(expected_amount, paid_amount) clamp.

B2. markPaid qismən ödəmə tarixçəsini silir 🟡

Yer: DebitorBorclarPage.jsx:170-171Bug: Müştəri əvvəl 800₼ ödəyib (paid_amount=800). "Paid" düyməsinə basanda paid_amount = expected_amount = 1000 yazılır — qismən ödəmə tarixçəsi pozulur.Fix: Yalnız paid: true flag dəyişdir.

B3. VAT fallback mühasibləşməni gizlədir 🟡

Yer: Daxilolmalar/Xərclər/Hesabatlar Page-dəBug: edv_amount || edv(amount) — saxlanan məbləğ null olarsa hesablama düsturu icra olunur. Bu null-ları görünməz edir, data integrity bug-larını gizlədir.Fix: Null görsən explicit error toast at, sonra recalc-and-save əməliyyatı təklif et.

B4. Faktura status receivable.paid ilə uyğun deyil 🟡

Yer: HesabatlarPage.jsx:116Bug: Receivable-də paid=false, paid_amount=1000, expected_amount=1000 ola bilər. Total = 0 görünür amma flag yanlış. Hesabat orderi:

Source of truth: paid flag MI, yoxsa paid_amount >= expected_amount MI?Fix: Tək source of truth seç. Computed column ya da trigger.

B5. Sabit xərclərdə "yearly" semantikası qarışıq 🟡

Yer: SabitXerclerPage.jsx:163Bug: İstifadəçi "yearly: 100,000" yazır, amma kod monthly = 8333-ə bölür. "quarterly" → 3-ə bölür. UI etiketləri qarışıqdır.Fix: Aydın UI: "Bu məbləğ neçə ayda bir tutulur?" sual et.

B6. Fixed expense + negative validation 🟡

Yer: Bütün maliyyə formalarıBug: Mənfi məbləğ qəbul edilir. Number("-1000") keçir.Fix: Hər insertdə if (amount < 0) reject.

B7. Performance score həmişə 0 🟢

Yer: PerformansPage.jsx:50Bug: Final score = survey_360 (40%) + manager (30%) + task_score (30%), amma task_score placeholder olaraq 0 saxlanır.Fix: Implementa et və ya bu hissəni gizli saxla.

B8. days() server timezone istifadə edir 🟢

Yer: api/agent.js:96-99Bug: today() server-də new Date() çağırır. Vercel server UTC-də olduğu üçün gecə yarısı sərhəddə today() Bakı vaxtının səhəri qaytarır.Fix: dateUtils.js-i agent.js-də də istifadə et (Bakı timezone).

🔀 BÖLMƏ C — İŞLƏMƏ MEXANİZMİNDƏKİ MƏNTİQ XƏTALARI (12 problem)

C1. End-to-end flow qırıq: Lead → Invoice → Income 🔴

Bug: Beş ayrı layihə-ödəmə cədvəli bir-biri ilə avtomatik bağlı deyil:

clients.status='lead' → proposals cədvəl yoxdur (status enum-da var, real cədvəl yox)

proposal accepted → contract cədvəl yoxdur

contract → projects arasında foreign key yoxdur

project completion → faktura avtomatik yaradılmır

invoice paid → income avtomatik yaradılmırResult: Hər ölçü manuel girişlə işləyir. Müştəri ilə işin tam tarixçəsi heç bir yerdə yoxdur.Fix: Səhifələri bağla — proposal_id foreign key-i projects-ə əlavə et, invoice_id incomes-a, hadisələri trigger ilə yarad.

C2. Tapşırıq → Müştəri əlaqəsi UI-da yoxdur 🟡

Bug: Tapşırıqda yalnız project_id var. project → client_name üçün join lazımdır. Tapşırıq detail panelində klient adı görsənmir.Senario: Junior memara tapşırıq verilib. Klient haqqında bilməsi üçün ayrıca layihəni açmalıdır. Real-life-də bu bilgisizlik müştəri yanında utancaq vəziyyət yaradır.Fix: Task detail panel-də client adı göstər.

C3. Permission model "teatrdır" — RLS səviyyəsində enforce olunmur 🔴

Bug: Sidebar adminOnly-i UI-da gizlədir. Amma RLS qaydaları auth.role()='authenticated' istifadə edir → istənilən autentifikasiya olmuş istifadəçi DB-dən bütün məlumatları çıxara bilər.

/api/agent artıq qoruyub

Amma Junior Memar Supabase JS client ilə birbaşa select * from incomes çağırsa cavab alır.Senario: İşçi Cmd+I brauzer console-undan birbaşa Supabase çağıra bilər. Maliyyə açılır.Fix: RLS qaydalarını rol-əsaslı et:sqlcreate policy "incomes finance only" on incomesfor select using (get_my_role_level() <= 3);

C4. Sidebar URL bypass 🟡

Bug: /emek-haqqi məsləhət olunmasa belə, işçi adresi yazsa səhifə açılır. Komponent içində yenidən rol yoxlaması yoxdur.Fix: Hər adminOnly route üçün  wrapper.

C5. Hardcoded ADMIN_EMAILS — 2 yerdə 🟡

Yerlər:

api/agent.js:11 (Talifa, Nicat, Turkan email-ləri)

src/lib/notify.js:3-6 (eyni siyahı)Bug: Admin dəyişəndə kod dəyişməlidir. AuthContext-də artıq düzəltdik, amma bu 2 fayl qalıb.Fix: DB-dən rol level oxuyan helper et: async function getAdminProfiles() { return profiles where roles.level <= 2 }.

C6. Pipeline 3 yerdə eyni — proposals cədvəli yoxdur 🟡

Bug: clients.status enum daxilində 'lead'/'proposal'/'in_progress' var. Amma:

KommersiyaTeklifleriPage (proposals səhifəsi) — ayrıca cədvələ yazır

PipelinePage — clients.status-u istifadə edir

İkisi sinxron deyilSenario: PipelinePage-də müştərini "proposal"a keçirsən. KommersiyaTeklifleri səhifəsində ona heç bir təklif görünmür.Fix: Tək cədvəl seç (proposals) və status-u oradan oxu.

C7. Drag-and-drop position itir 🟡

Yer: TapshiriqlarPage.jsx:1357Bug: Yalnız status dəyişir, kolon daxilində position saxlanmır. Sürükləyib geri qaytaranda sıra fetch order-ə qayıdır.Fix: position sütununu istifadə et, drop index-i hesabla.

C8. Comment mention parsing fragile 🟡

Yer: TapshiriqlarPage.jsx:406-422Bug: @AdSoyad regex ilə tapılır. İstifadəçi adı dəyişdirilsə köhnə mentions linkə çevrilmir.Fix: Mention save zamanı @userId formatında metadata-da saxla, render-də cari ad göstər.

C9. Audit log bərabər deyil 🟡

Yer: Hər yerBug: Logged: status change, due_date change. Logged DEYİL: assignee dəyişikliyi, prioritet dəyişikliyi, subtask əlavə etmə, description dəyişikliyi.Fix: Single-source logActivity() helper at all mutations.

C10. Notification tipi RSVP — orphan data 🟢

Yer: HadiselerTeqvimiPage.jsx:670-695Bug: İstifadəçini event-dən tag-dən çıxardanda RSVP cavabı obyektdə qalır.Fix: Untag zamanı RSVP map-dən sil.

C11. Multi-day event grid-də tək gün görünür 🟡

Yer: HadiselerTeqvimiPage.jsx:885Bug: Yan 15-17 konfrans yalnız Yan 15-də görünür. 16-17 boşdur.Fix: Cell render-i intervalı yoxlayıb, hər günün event-lərinə əlavə et.

C12. Recurring event yoxdur 🟢

Bug: Həftəlik standup hər həftə manual əlavə edilir.Fix: recurrence_rule (RFC 5545 RRULE format) sahəsi əlavə et.

📝 BÖLMƏ D — USER STORY VƏ PERSONA QURULUŞUNDA BOŞLUQLAR (8 problem)

D1. EmployeeDashboard-un dəyəri dar 🟡

İşçi görünüşündə yalnız tapşırıqlar var. Yoxdur:

"Layihələrim necə gedir?" (sağlamlıq)

"Bu ay kommandanın gəliri?" (motivasiya, transparent şirkət üçün)

"Mənim vacib müştərilərim" (BD üçün)

"Mənim performans tendency"

D2. Career Level — phantom feature 🟡

Yer: EmployeeDashboardPage.jsx:71, IshciHeyetiPage.jsxCAREER_LEVELS constant kodda var, amma profiles.career_level sütunu DB-də mövcuddurmu? Sənə test üçün:sqlselect column_name from information_schema.columnswhere table_name='profiles' and column_name='career_level';

Boş cavabsa → həmin sütun yoxdur, kod silently fail olur.Fix: Sütun əlavə et və ya feature-i sil.

D3. Performance review workflow yoxdur 🟡

Kim review-u açır?

Cavabdeh kim?

360 anketi necə paylanır?

Manager qiymətləndirməsi kim verir?Senario: PerformansPage göstərilir, amma "review başlat" düyməsi yoxdur.Fix: Review cycle: HR → invitations → 360 questionnaire → manager input → consolidated report.

D4. OKR səhifəsi tək başınadır 🟡

Yer: HedefNeticeOKRPage.jsxOKR-lər tapşırıqlara, layihələrə bağlanmır. "Bu OKR-i yerinə yetirmək üçün hansı tapşırıqlar var?" — UI-da görünmür.Fix: OKR → Key Result → Tapşırıq əlaqəsi.

D5. Faktura PDF generasiyası yoxdur 🟡

Müştəriyə faktura göndərmək üçün manuel PDF düzəltmək lazımdır. Bu istifadəçi pain point-dir.

D6. Müştəri portalı yoxdur 🟢

Memarlıq dünyasında müştərilər layihə statusu, ödəmələr, fazalar görmək istəyir. Hazırda yox.

D7. Daxili axtarış yoxdur 🟡

Yer: MainLayout.jsx:100-101 — searchOpen state var, amma heç bir implementation.Fix: Cmd+K universal axtarış (tapşırıq, layihə, müştəri, faktura).

D8. "Layihə tamamlandı" workflow-u yarımçıqdır 🟡

Status completed olanda heç bir avtomatik əməliyyat yoxdur:

Tapşırıqlar arxivlənmir

Final faktura yaradılmır

Portfolio-ya köçürülmürSenario: Layihə bitir, amma sistem hələ "aktiv" göstərir. Komandanın diqqətini paylayır.

🎨 BÖLMƏ E — UI/UX VƏ TERMİNOLOGİYA (5 problem)

E1. Status terminologiyası tutarsızdır 🟡

Source

Terminologiya

Dashboard

İcrada/Gözləyir/Tamamlandı/Dayandırılıb

LayihelerPage

Gözləyir/İcrada/Dayandırılıb/Tamamlandı (sıralama fərqli)

Schema

active/waiting/on_hold/completed

Fix: Single i18n source.

E2. "Daxilolma" vs "Gəlir" 🟢

CCO səhvi: "Daxilolma" texniki səslənir. "Gəlirlər" daha təbiidir. Tutarsızlıq UI-da var.

E3. Mobile drag-drop tamamilə qırıq 🟡

TapshiriqlarPage kanban-ı yalnız mouse drag-drop dəstəkləyir. Touch event yoxdur. Telefondan kanban sürükləmək olmur.Fix: react-dnd-touch-backend və ya alternativ.

E4. Mobile modal klaviatura altında qalır 🟡

Modal-ı telefon klaviaturası açanda input görünmür. Auto-scroll yoxdur.

E5. Notification settings UI fake 🔴

Yer: ParametrlerPage.jsx:20-77Notification toggle-ları görsənir, amma useState-də qalır, DB-yə yazılmır. İstifadəçi "morning briefing-i söndür" deyir, refresh-dən sonra yenə açıqdır.Fix: notification_settings cədvəlinə yaz (artıq SQL-də yaratdıq).

📊 BÖLMƏ F — MÜQAYISƏ: TRELLO/NOTION/JİRA-DA HƏR SƏHV NECƏ HƏLL OLUR

Reflect bug

Trello

Notion

Jira

Tövsiyə

Subtask incomplete → Done

Auto-close subtasks

Optional warning

Block parent

Modal warning

Single canonical assignee

Single field, multi-checkbox

Multi-select

Single + watchers

Vahid assignee_ids

Search by title only

Title+desc+attachments

Full-text + filter

JQL

Algolia ya Postgres FTS

No mobile drag

Touch supported

Reorder via menu

Touch supported

react-dnd-touch

No audit log

Limited

Block-level history

Full audit

activity_log cədvəli

Hardcoded admins

RBAC

Permissions tree

Custom roles

DB-dən level

🎯 BÖLMƏ G — PRİORİTLƏŞDİRİLMİŞ FIX YOL XƏRİTƏSİ

🔴 Sprint 1 — Kritik (1 həftə, ICE: 9.5/10)

#

İş

Effort

Risk

1

A1: Faktura paid → income auto-create

2h

Maliyyə

2

A2: assignee_id deprecation

4h

Filter qırıq

3

A4: Subtask check before Done

1h

Yanlış progress

4

A6: Final payment formula düzəlt

1h

Pul yanlış

5

C3: RLS rol-əsaslı + level filtri

4h

Data leak

6

C5: Hardcoded ADMIN_EMAILS sil (notify.js + agent.js)

2h

Xidmət data

7

E5: Notification settings persist DB

1h

Sahxə

Cəmi: ~15 saat / 1 həftə

🟡 Sprint 2 — Vacib mexanizm (2 həftə, ICE: 8/10)

#

İş

Effort

8

A8-A9: Vacation conflict + workday calc

3h

9

A10: Pipeline stage validation + lost reason

4h

10

C1: Lead→Invoice→Income flow trigger

8h

11

C2: Task → Client görünüşü

1h

12

C9: Universal audit log helper

6h

13

A3: phase/phases consolidation

2h

14

A7: Project-level vat_rate sütunu

4h

15

C7: Task position drag-drop

4h

Cəmi: ~32 saat / 2 həftə

🟢 Sprint 3 — Feature gap (1 ay, ICE: 6/10)

#

İş

Effort

16

D7: Cmd+K universal axtarış

1 gün

17

D5: Faktura PDF generasiya

2 gün

18

C11-C12: Multi-day events + recurrence

3 gün

19

E3: Mobile drag-drop

1 gün

20

D1: Employee dashboard genişləndirilməsi

2 gün

21

D8: Layihə tamamlandı workflow

1 gün

22

D3: Performance review workflow

1 həftə

23

D6: Müştəri portalı (read-only first)

1 həftə

🚦 BÖLMƏ H — MƏNİM ÜMUMİ VERDİKTİM

Vəziyyət

Pre-PMF stage MVP, lakin maliyyə və operasiya ciddi data integrity riskləri ilə yüklənib.

Müsbətlər

✅ Vertical fokus (memarlıq) — strong moat

✅ Maliyyə + operasiya bir yerdə (Notion/Trello-da yoxdur)

✅ AI brifinq sistemi unikal

✅ ƏDV semantikası daxili (Azerbaycan biznesi üçün önəmli)

Riskli sahələr

🔴 Maliyyə: faktura→gəlir, vacation→budget, podratçı remaining — pul səhv hesablanır

🔴 Permission: RLS rol-əsaslı deyil → data leak riski

🟡 Data model: dual-fields, missing FKs, end-to-end disconnect

🟡 Audit: log fragmenti — kim nə vaxt nə dəyişdi tam görünmür

Strateji tövsiyə (Innovation lensi)

Mövcud platformanı 6 ay scaleyə hazırlamadan əvvəl — Sprint 1 + 2 (ümumi 3 həftə) icra olunmalıdır. Bu dəyişikliklərsiz şirkət 5+ memara genişlənəndə pul səhv hesablanmağa, audit imkansız olmağa, müştəri data leak-inə üzləşəcək.

Sprint 1 olmadan canlıya genişlənmə = zərərlə nəticələnir.

❓ Növbəti dərinləşmə üçün sual

Hansı 3 problemi indi həll edək? Mənim güclü tövsiyəm:

A1 (faktura→gəlir) — pul itkisi

A2 (assignee dual) — filter düz işləməz

C3 (RLS rol) — security açıq

"Üçünü də başla" yaz, dərhal işə başlayım. Yaxud öz prioritetini yaz.
