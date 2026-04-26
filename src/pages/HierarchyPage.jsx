import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

const LEVELS = [
  {
    key: 'RA-1', label: 'Founding Partner', sub: 'CEO & Chief Architect', az: 'Təsisçi Ortaq — CEO və Baş Memar',
    tag: 'Şirkət sahibi', color: '#0a0a0a', accent: '#ffffff',
    desc: 'Şirkətin strateji istiqamətini və bədii vizyonunu müəyyənləşdirir. Ən mühüm dizayn qərarlarını qəbul edir. Şirkətin texniki və bədii nüfuzunu şəxsən daşıyır. Əsas sifarişçilərlə strateji münasibət qurur.',
    years: null, reqs_detail: null
  },
  {
    key: 'RA-2', label: 'Partner', sub: 'Ortaq', az: 'Strateji rəhbər səviyyəsi',
    tag: 'Ortaq', color: '#111827', accent: '#e5e7eb',
    desc: 'Şirkətin müəyyən bir sahəsinin strateji rəhbərliyini həyata keçirir. CEO ilə birgə şirkətin inkişaf strategiyasını formalaşdırır. Böyük sifarişçi münasibətlərini şəxsən idarə edir.',
    years: null,
    reqs_detail: [
      { icon: '📁', label: 'Portfolio', text: 'Ən azı 5 böyük layihəni başdan sona müstəqil rəhbərlik edib tamamlamaq; bu layihələrdən ən azı biri şirkətin portfoliosuna dəyər katan olmalıdır — mükafat, media diqqəti və ya güclü sektoral referans.' },
      { icon: '💼', label: 'Biznes töhfəsi', text: 'Ən azı 2–3 yeni sifarişçi gətirib aktiv layihəyə çevirmək; şirkətin gəlir artımına ölçülə bilən töhfə vermək.' },
      { icon: '👥', label: 'Komanda liderliyi', text: 'Ən azı 3–5 işçinin mentoru olmaq və onları növbəti karyera səviyyəsinə çatdırmaq; komanda mədəniyyətini qorumaq və yaymaq.' },
      { icon: '🌐', label: 'Brend və nüfuz', text: 'Şirkəti peşəkar icmada təmsil etmək — konfrans, nəşr, mükafat; sektorda şəxsi tanınma qazanmaq.' },
      { icon: '📊', label: 'Maliyyə savadlılığı', text: 'Layihə büdcələrini idarə etmək, müqavilə şərtlərini müstəqil danışmaq, şirkətin maliyyə sağlamlığına məsuliyyət daşımaq.' },
      { icon: '🎯', label: 'Dəyər uyğunluğu', text: 'Şirkətin dizayn fəlsəfəsini tam qəbul etmək; uzunmüddətli öhdəlik və şirkətin gələcəyinə inanc.' },
    ]
  },
  {
    key: 'L2', label: 'Senior Associate', sub: 'Baş Əməkdaş', az: 'Texniki rəhbər',
    tag: 'Texniki rəhbər', color: '#1a2744', accent: '#dce8ff',
    desc: 'Böyük miqyaslı layihələri tam müstəqillikdə idarə edir. Dizayn keyfiyyətinə şəxsən cavabdehdir. Sifarişçi ilə bütün texniki məsələləri aparır. Gənc mütəxəssislərin mentoru.',
    years: '10+ il',
    reqs_detail: [
      { section: 'Texniki liderlik', items: ['Ən azı 3 böyük, mürəkkəb layihəni tam rəhbərlik etmək — hər biri şirkətin portfeline dəyər katan', 'Komanda qurma — ən azı 2 əməkdaşın karyera inkişafına birbaşa mentorluq töhfəsi', 'Sifarişçilərlə strateji münasibət — yalnız texniki yox, biznes söhbəti aparmaq bacarığı'] },
      { section: 'Kreativlik və peşəkar nüfuz', items: ['Şirkətin texniki və bədii nüfuzunu şəxsən daşımaq — müstəqil dizayn imzası ilə sektorda tanınmaq', 'Şirkəti beynəlxalq peşəkar platformalarda (Archdaily, Dezeen, WAF) layihə ilə təmsil etmək', 'Beynəlxalq yarışmada şirkəti rəhbər kimi təmsil edib nəticəyə çatdırmaq', 'Peşəkar tədbirlərdə — konfrans, panel — məruzəçi kimi çıxış etmək', 'Sektorda öz araşdırma sahəsi formalaşdırmaq — nəticələri komandanın inkişafına töhfə kimi çatdırmaq', 'Şirkətin biznes inkişafına birbaşa töhfə — yeni sifarişçi əlaqəsi, yeni bazar imkanı açmaq'] },
      { section: 'Performans', items: ['Minimum 5 il L2 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
  {
    key: 'L3', label: 'Project Architect', sub: 'Layihə Memarı', az: 'Layihə rəhbəri',
    tag: 'Layihə rəhbəri', color: '#1a3d2e', accent: '#d0f0e0',
    desc: 'Müstəqil olaraq tam layihə dövrünü idarə edir — konseptdən müəllif nəzarətinə qədər. Podratçı münasibətlərini koordinasiya edir. İşçi sənədlərin keyfiyyətinə şəxsən cavabdehdir.',
    years: '6–10 il',
    reqs_detail: [
      { section: 'Texniki bacarıqlar', items: ['Ən azı 2 böyük layihəni başdan sona — konseptdən tikinti nəzarətinə qədər — tam müstəqil rəhbərlik etmək', 'Komanda idarəetməsi — 2-3 junior/mid-level memar ilə eyni vaxtda işləmək', 'Çoxsaylı paralel layihəni idarə etmək — prioritet, resurs, vaxt planlaması', 'Podratçı münasibətlərini tam müstəqil aparmaq — müqavilə, nəzarət, qəbul aktı', 'Layihə büdcəsini izləmək — xərclər, sapma analizi, rəhbərə hesabat'] },
      { section: 'Kreativlik, araşdırma və peşəkar nüfuz', items: ['Müstəqil dizayn imzası formalaşdırmaq — öz estetik yanaşması və həll metodologiyası ilə fərqlənmək', 'Şirkəti beynəlxalq peşəkar platformalarda (Archdaily, Dezeen, WAF) layihə ilə təmsil etmək', 'Beynəlxalq yarışmada şirkəti rəhbər kimi təmsil edib nəticəyə çatdırmaq', 'Peşəkar tədbirlərdə — konfrans, panel, açıq mühazirə — məruzəçi kimi çıxış etmək', 'Sektorda öz araşdırma sahəsi formalaşdırmaq — nəticələri komandaya strukturlu şəkildə çatdırmaq'] },
      { section: 'Performans', items: ['Minimum 4 il L3 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
  {
    key: 'L4', label: 'Architect', sub: 'Memar', az: 'Müstəqil mütəxəssis',
    tag: 'Müstəqil', color: '#2d3a00', accent: '#eaf0b0',
    desc: 'Layihənin müəyyən hissəsini tam müstəqillikdə idarə edir. Texniki həlləri özü işləyib hazırlayır. Öz peşəkar üslubunu formalaşdırmışdır. Sifarişçi ilə birbaşa işləyir.',
    years: '3–6 il',
    reqs_detail: [
      { section: 'Texniki bacarıqlar', items: ['Revit, AutoCAD, SketchUp — expert səviyyə; junior əməkdaşlara sənəd standartlarını öyrətmək bacarığı', 'Layihənin böyük bir hissəsini (tam interior, tam fasad sistemi, tam tikinti sənədləri paketi) tam müstəqil idarə etmək', 'Sifarişçi ilə müstəqil texniki görüşlər — qərar qəbulu, geri əlaqə, razılaşma', 'Ən azı 1 layihənin tikinti nəzarəti mərhələsini müşayiət etmək — sahə görüşləri, podratçı koordinasiyası'] },
      { section: 'Kreativlik, araşdırma və peşəkar görünürlük', items: ['Layihə konseptinə dizayn səviyyəsində müstəqil töhfə vermək — rəhbərin istiqamətini gözləmədən öz həllini ortaya qoymaq', 'Şirkətin peşəkar görünürlüyünə ölçülə bilən töhfə vermək — tamamlanmış layihəni Archdaily, Dezeen və ya yerli peşəkar nəşrə göndərmək üçün materialları hazırlamaq', 'Ən azı 1 yarışmada layihə koordinatoru kimi iştirak etmək — komandanı idarə edərək tam sənəd paketini çatdırmaq', 'Sektorda müntəzəm araşdırma aparmaq — yeni texnologiya, material və ya dizayn yanaşmasını komandaya strukturlu şəkildə təqdim etmək', 'Yerli peşəkar tədbirlərdə — konfrans, seminar, açıq mühazirə — iştirakçı kimi aktiv olmaq'] },
      { section: 'Performans', items: ['Minimum 3 il L4 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
  {
    key: 'L5', label: 'Junior Architect', sub: 'Kiçik Memar', az: 'İnkişaf mərhələsi',
    tag: 'İnkişaf edən', color: '#3a1f00', accent: '#f5ddb0',
    desc: 'Baş memar və ya layihə memarının rəhbərliyi altında çalışır. Çertyoj, texniki sənəd, koordinasiya işlərini aparır. Müstəqil qərar qəbulundan əvvəlki formalaşma mərhələsidir.',
    years: '1–3 il',
    reqs_detail: [
      { section: 'Texniki bacarıqlar', items: ['Revit, AutoCAD, SketchUp — orta-yüksək səviyyə; müstəqil model, sənəd, vizualizasiya işləri', 'Layihənin bir hissəsini (məs: bir fasad, bir otağın tam sənədləşməsi) nəzarətsiz tamamlamaq', 'Sifarişçi ilə ilk birbaşa görüş — rəhbər iştirakı ilə, öz fikrini aydın ifadə etmək', 'Deadline-lara sistemli riayət; komanda daxilində aktiv koordinasiya'] },
      { section: 'Kreativlik, araşdırma və peşəkar görünürlük', items: ['Layihənin konsept mərhələsində öz dizayn ideyalarını irəli sürmək — yalnız texniki icraçı yox, düşünən memar', 'Sektoru dərindən izləmək — yeni material, texnologiya, dizayn tendensiyaları barədə komandaya strukturlu məlumat paylaşmaq', 'Ən azı 1 beynəlxalq və ya yerli yarışmada aktiv iştirak etmək — tam sənəd paketinin hazırlanmasında əsas töhfə vermək', 'Öz portfelini Archdaily, Behance və ya oxşar peşəkar platformada keyfiyyətli şəkildə yerləşdirmək'] },
      { section: 'Performans', items: ['Minimum 2 il L5 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
  {
    key: 'L6', label: 'Architectural Assistant', sub: 'Memar Köməkçisi', az: 'Giriş səviyyəsi',
    tag: 'Başlanğıc', color: '#2a1540', accent: '#e8d0ff',
    desc: 'Rəsmi memarlıq təhsili olan, lakin hələ peşəkar qeydiyyatını tamamlamamış kadr. Bütün texniki işlərdə köməkçi funksiya daşıyır. Şirkətin gələcək potensialını formalaşdırır.',
    years: '0–1 il',
    reqs_detail: [
      { section: 'Texniki bacarıqlar', items: ['Revit, AutoCAD, SketchUp — baza səviyyəsi; nəzarət altında çertyoj, 3D model, sənəd işləri', 'Şirkətin layihə standartlarını və fayl strukturunu öyrənib tətbiq etmək', 'Verilən tapşırıqları vaxtında, keyfiyyətlə tamamlamaq; gözlənilməz hallarda vaxtında xəbər vermək'] },
      { section: 'Kreativlik və peşəkar inkişaf', items: ['Layihə görüşlərində aktiv olmaq — yalnız dinləmək yox, sual vermək, fikir irəli sürmək', 'Sektoru sistematik izləmək — Archdaily, Dezeen və oxşar platformalar vasitəsilə referans layihələri müntəzəm araşdırmaq', 'Ən azı 1 yarışmada şirkət komandasının üzvü kimi iştirak etmək'] },
      { section: 'Performans', items: ['Minimum 1 il L6 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
]

const BD_LEVELS = [
  {
    key: 'BD-1', label: 'Head of BD & Community', sub: 'Biznes İnkişaf Rəhbəri', az: 'Direktor səviyyəsi',
    tag: 'Direktor', color: '#1a3040', accent: '#c0e0f8',
    desc: 'Şirkətin yeni müştəri axınını, strateji tərəfdaşlıqlarını və ictimai nüfuzunu idarə edir. Brendin mövqeləndirilməsinə rəhbərlik edir. Peşəkar icmada şirkəti təmsil edir.',
    years: null, reqs_detail: null
  },
  {
    key: 'BD-2', label: 'Junior BD Manager', sub: 'BD Köməkçi Menecer', az: 'Biznes inkişaf',
    tag: 'BD', color: '#0f2030', accent: '#a8d0f0',
    desc: 'Potensial müştərilərin aşkarlanması, ilkin əlaqə qurulması, kommersiya təkliflərinin hazırlanmasında iştirak edir. BD Rəhbərinin rəhbərliyi altında çalışır.',
    years: '1–3 il',
    reqs_detail: [
      { section: 'Əsas bacarıqlar', items: ['Ən azı 3 aktiv layihəni müstəqil şəkildə əldə edib bağlamaq', 'CRM pipeline-ını sistemli aparmaq — hər mərhələdə izlənilə bilən nəticə', 'Kommersiya təkliflərini müstəqil hazırlamaq və müdafiə etmək', 'Strateji tərəfdaşlıqlar qurmaq — şirkət adından danışıqlar aparma bacarığı'] },
      { section: 'Peşəkar görünürlük', items: ['Şirkətin peşəkar görünürlüyünə ölçülə bilən töhfə vermək — sektoral tədbirlərdə Reflect-i tanıtmaq, potensial sifarişçilər və tərəfdaşlarla münasibət qurmaq', 'Sektoru dərindən izləmək — bazar tendensiyaları, potensial sifarişçilər, rəqiblər barədə müntəzəm analitik məlumat hazırlamaq'] },
      { section: 'Performans', items: ['Minimum 3 il BD-2 səviyyəsində iş + 2 ardıcıl il 4.5+/5.0 performans skoru'] },
    ]
  },
]

const CAREER_PATH = [
  { key: 'L6', label: 'Architectural Assistant', years: '0–1 il', dot: '#2a1540', reqs: 'Memarlıq məzunu. Revit, AutoCAD, SketchUp baza biliyisi. Nəzarət altında çertyoj, model, sənəd işləri.' },
  { key: 'L5', label: 'Junior Architect', years: '1–3 il', dot: '#3a1f00', reqs: 'Layihənin bir hissəsini müstəqil idarə edir. İlk dəfə sifarişçi ilə birbaşa əlaqə. Yarışmalarda iştirak.' },
  { key: 'L4', label: 'Architect', years: '3–6 il', dot: '#2d3a00', reqs: 'Tam layihə məsuliyyəti. Müstəqil dizayn qərarları. Peşəkar platformalarda görünürlük.' },
  { key: 'L3', label: 'Project Architect', years: '6–10 il', dot: '#1a3d2e', reqs: 'Böyük layihə rəhbərliyi. Komanda idarəetməsi. Beynəlxalq yarışma rəhbəri.' },
  { key: 'L2', label: 'Senior Associate', years: '10+ il', dot: '#1a2744', reqs: 'Şirkətin texniki nüfuzunu daşıyır. Mentorluq. Beynəlxalq peşəkar platforma.' },
  { key: 'RA-2', label: 'Partner', years: '—', dot: '#111827', reqs: 'Strateji rəhbərlik. Biznes töhfəsi. Komanda liderliyi. Peşəkar nüfuz.' },
  { key: 'RA-1', label: 'Founding Partner — CEO & Chief Architect', years: '—', dot: '#0a0a0a', reqs: 'Şirkətin strateji istiqaməti. Tam idarəetmə məsuliyyəti.' },
]

function RA2Card({ level }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden mb-2" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
      <button className="w-full flex items-center gap-3 px-5 py-4 text-left" style={{ background: level.color }} onClick={() => setOpen(o => !o)}>
        <span className="text-[10px] font-black tracking-[0.2em] min-w-[52px]" style={{ color: level.accent, opacity: 0.5 }}>{level.key}</span>
        <div className="flex-1">
          <div className="text-base font-bold" style={{ color: level.accent }}>{level.label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: level.accent, opacity: 0.6 }}>{level.az}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: level.accent }}>{level.tag}</span>
          {open ? <IconChevronUp size={15} style={{ color: level.accent, opacity: 0.4 }} /> : <IconChevronDown size={15} style={{ color: level.accent, opacity: 0.4 }} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-4" style={{ background: level.color }}>
          <p className="text-xs leading-relaxed mb-4" style={{ color: level.accent, opacity: 0.75 }}>{level.desc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {level.reqs_detail.map((item, i) => (
              <div key={i} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-[11px] font-bold" style={{ color: level.accent }}>{item.label}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: level.accent, opacity: 0.65 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LevelCard({ level }) {
  const [open, setOpen] = useState(false)
  if (level.key === 'RA-2') return <RA2Card level={level} />
  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: level.color }} onClick={() => setOpen(o => !o)}>
        <span className="text-[10px] font-bold tracking-[0.15em] min-w-[48px]" style={{ color: level.accent, opacity: 0.45 }}>{level.key}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: level.accent }}>{level.label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: level.accent, opacity: 0.6 }}>{level.sub}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:block" style={{ background: 'rgba(255,255,255,0.1)', color: level.accent }}>{level.tag}</span>
          {open ? <IconChevronUp size={14} style={{ color: level.accent, opacity: 0.4 }} /> : <IconChevronDown size={14} style={{ color: level.accent, opacity: 0.4 }} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ background: level.color }}>
          <p className="text-xs leading-relaxed" style={{ color: level.accent, opacity: 0.78 }}>{level.desc}</p>
          {level.years && <div className="text-[11px]" style={{ color: level.accent, opacity: 0.45 }}>⏱ {level.years} təcrübə</div>}
          {level.reqs_detail && (
            <div className="space-y-2">
              {level.reqs_detail.map((block, bi) => (
                <div key={bi} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: level.accent, opacity: 0.4 }}>{block.section}</div>
                  <div className="space-y-1.5">
                    {block.items.map((item, ii) => (
                      <div key={ii} className="flex gap-2">
                        <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: level.accent, opacity: 0.3 }}>→</span>
                        <span className="text-[11px] leading-relaxed" style={{ color: level.accent, opacity: 0.72 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TABS = [
  { label: 'Tam struktur', id: 'struct' },
  { label: 'Karyera yolu', id: 'path' },
  { label: 'Erkən yüksəliş', id: 'early' },
]

export default function HierarchyPage() {
  const [tab, setTab] = useState('struct')

  return (
    <div className="p-4 lg:p-6 fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-black tracking-wider">RA</span>
          </div>
          <h1 className="text-base font-bold text-[#0f172a]">Karyera Strukturu</h1>
        </div>
        <p className="text-xs text-[#888] ml-11">Reflect Architects — ierarxiya, inkişaf yolu və yüksəliş meyarları</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#f5f5f0] rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs px-4 py-2 rounded-lg transition-all font-medium ${
              tab === t.id
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-[#888] hover:text-[#555]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAM STRUKTUR */}
      {tab === 'struct' && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-[#e8e8e4]" />
            <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Memarlıq bölməsi</span>
            <div className="h-px flex-1 bg-[#e8e8e4]" />
          </div>
          {LEVELS.map(l => <LevelCard key={l.key} level={l} />)}

          <div className="flex items-center gap-2 my-5">
            <div className="h-px flex-1 bg-[#e8e8e4]" />
            <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest whitespace-nowrap">Biznes inkişaf bölməsi</span>
            <div className="h-px flex-1 bg-[#e8e8e4]" />
          </div>
          {BD_LEVELS.map(l => <LevelCard key={l.key} level={l} />)}
        </div>
      )}

      {/* KARYERA YOLU */}
      {tab === 'path' && (
        <div className="max-w-lg">
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-5">
            <div className="text-xs font-bold text-[#0f172a] mb-6">Memarlıq karyera yolu</div>
            {CAREER_PATH.map((step, i) => (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-white" style={{ background: step.dot }} />
                  {i < CAREER_PATH.length - 1 && (
                    <div className="w-px flex-1 mt-1 mb-1" style={{ background: step.dot, opacity: 0.15 }} />
                  )}
                </div>
                <div className={`pb-5 ${i === CAREER_PATH.length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white tracking-wider" style={{ background: step.dot }}>{step.key}</span>
                    <span className="text-xs font-bold text-[#0f172a]">{step.label}</span>
                  </div>
                  <div className="text-[10px] text-[#bbb] mb-1">{step.years}</div>
                  <div className="text-[11px] text-[#666] leading-relaxed">{step.reqs}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERKƏN YÜKSƏLİŞ */}
      {tab === 'early' && (
        <div className="max-w-lg space-y-3">
          <div className="bg-[#0f172a] rounded-2xl p-5 text-white">
            <div className="text-sm font-bold mb-2">🚀 Erkən yüksəliş nədir?</div>
            <p className="text-xs leading-relaxed text-white/70">
              Standart müddəti tamamlamadan əvvəl növbəti karyera səviyyəsinə yüksəlmə imkanıdır.
              Yüksək performans göstərən əməkdaşlar üçün nəzərdə tutulmuşdur.
              2 ardıcıl ildə yüksək skor əldə edən işçilər bu hüququ qazanır.
            </p>
          </div>

          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-5">
            <div className="text-xs font-bold text-[#0f172a] mb-4">Meyarlar</div>
            <div className="space-y-3">
              {[
                { icon: '⭐', title: '2 ardıcıl il 4.5+/5.0 performans skoru', desc: '360° survey + rəhbər qiyməti + tapşırıq statistikasının ağırlıqlı ortalaması' },
                { icon: '✅', title: 'Rəhbər tövsiyəsi', desc: 'Birbaşa rəhbərin yazılı tövsiyəsi — əməkdaşın növbəti səviyyəyə hazır olduğunu təsdiqləyir' },
                { icon: '📋', title: 'Növbəti səviyyənin tələbləri', desc: '"Tam struktur" tabında hər səviyyə üçün göstərilən bütün meyarların qarşılanması' },
                { icon: '📅', title: 'Minimum 1 il cari səviyyədə iş', desc: 'Erkən yüksəliş belə, ən azı 1 il cari vəzifədə olmağı tələb edir' },
              ].map(item => (
                <div key={item.title} className="flex gap-3 pb-3 border-b border-[#f5f5f0] last:border-0 last:pb-0">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-[#0f172a]">{item.title}</div>
                    <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-5">
            <div className="text-xs font-bold text-[#0f172a] mb-4">Performans skoru necə hesablanır?</div>
            <div className="space-y-2.5">
              {[
                { label: '360° Survey', weight: '40%', color: '#0f172a', desc: 'Həmkarlar + rəhbər + özü — Google Forms vasitəsilə ildə bir dəfə' },
                { label: 'Rəhbər qiyməti', weight: '30%', color: '#1a3d2e', desc: 'Texniki keyfiyyət, müstəqillik, şirkətə töhfə — ildə bir dəfə admin daxil edir' },
                { label: 'Tapşırıq statistikası', weight: '30%', color: '#1a2744', desc: 'Tapşırıq tamamlama faizi — sistem avtomatik hesablayır' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white" style={{ background: item.color }}>
                    {item.weight}
                  </div>
                  <div className="pt-1">
                    <div className="text-xs font-semibold text-[#0f172a]">{item.label}</div>
                    <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#f0f0ec] flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#888]">Erkən yüksəliş hüququ üçün minimum</div>
                <div className="text-[11px] text-[#888] mt-0.5">2 ardıcıl ildə bu skoru saxlamaq lazımdır</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-green-600">4.5+</div>
                <div className="text-[10px] text-[#aaa]">/ 5.0 bal</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
