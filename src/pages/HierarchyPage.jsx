import { useState } from 'react'
import { Card } from '../components/ui'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

const LEVELS = [
  {
    key: 'L1', label: 'Principal / Founding Partner', az: 'Baş Ortaq / Təsisçi Ortaq',
    tag: 'Şirkət sahibi', color: '#0a0a0a', text: '#f5f5f0',
    desc: 'Şirkətin strateji istiqamətini müəyyənləşdirir. Ən mühüm dizayn qərarlarını qəbul edir. Şirkətin bədii və texniki nüfuzunu daşıyır. Əsas sifarişçilərlə şəxsi münasibət qurur.',
    who: 'Nicat Nusalov · Talifa İsgəndərli · Türkan Agayeva', years: null,
    next_reqs: null, section: 'arch'
  },
  {
    key: 'L2', label: 'Senior Associate', az: 'Baş Əməkdaş',
    tag: 'Texniki rəhbər', color: '#1a2744', text: '#dce8ff',
    desc: 'Böyük miqyaslı layihələri müstəqil idarə edir. Dizayn keyfiyyətinə cavabdehdir. Sifarişçi ilə bütün texniki məsələləri aparır. Gənc mütəxəssislərin mentoru.',
    who: 'Orxan Fataliyev', years: '10+ il',
    next_reqs: null, section: 'arch'
  },
  {
    key: 'L3', label: 'Project Architect', az: 'Layihə Memarı',
    tag: 'Layihə rəhbəri', color: '#1a3d2e', text: '#d0f0e0',
    desc: 'Müstəqil olaraq tam layihə dövrünü idarə edir — konseptdən müəllif nəzarətinə qədər. Podratçı münasibətlərini koordinasiya edir. İşçi sənədlərin keyfiyyətinə şəxsən cavabdehdir.',
    who: '— (gələcək kadr)', years: '6–10 il',
    next_reqs: 'Böyük layihə rəhbərliyi · Komanda idarəetməsi · Çoxsaylı paralel layihə', section: 'arch'
  },
  {
    key: 'L4', label: 'Architect', az: 'Memar',
    tag: 'Müstəqil mütəxəssis', color: '#2d3a00', text: '#eaf0b0',
    desc: 'Layihənin müəyyən hissəsini müstəqil idarə edir. Texniki həlləri özü işləyib hazırlayır. Sınaq mərhələsindən uğurla keçib öz üslubunu formalaşdırmışdır.',
    who: '— (gələcək kadr)', years: '3–6 il',
    next_reqs: 'Tam layihə məsuliyyəti · Peşəkar lisenziya · Büdcə idarəetməsi', section: 'arch'
  },
  {
    key: 'L5', label: 'Junior Architect', az: 'Kiçik Memar',
    tag: 'İnkişaf edən', color: '#3a1f00', text: '#f5ddb0',
    desc: 'Baş memar və ya layihə memarının rəhbərliyi altında çalışır. Çertyoj, texniki sənəd, koordinasiya işlərini aparır. Müstəqil qərar qəbulundan əvvəlki formalaşma mərhələsi.',
    who: 'Zeyneb Şeydazadə · Aydan Abbaszadə · Osman Qocayev · Zeyneb Tariverdiyeva',
    years: '1–3 il',
    next_reqs: 'Layihənin tam bir hissəsini müstəqil idarə · Sifarişçi ilə birbaşa əlaqə · Texniki müstəqillik', section: 'arch'
  },
  {
    key: 'L6', label: 'Architectural Assistant', az: 'Memar Köməkçisi',
    tag: 'Başlanğıc', color: '#2a1540', text: '#e8d0ff',
    desc: 'Rəsmi memarlıq təhsili olan, lakin hələ peşəkar qeydiyyatını tamamlamamış kadr. Bütün texniki işlərdə köməkçi funksiya daşıyır.',
    who: '— (staj / giriş səviyyəsi)', years: '0–1 il',
    next_reqs: 'Revit/AutoCAD baza biliyisi · Nəzarət altında çertyoj, model, sənəd işləri', section: 'arch'
  },
]

const BD_LEVELS = [
  {
    key: 'BD-1', label: 'Head of Business Development & Community', az: 'Biznes İnkişaf və İcma Rəhbəri',
    tag: 'Direktor səviyyəsi', color: '#1a3040', text: '#c0e0f8',
    desc: 'Şirkətin yeni müştəri axınını, strateji tərəfdaşlıqlarını və ictimai nüfuzunu idarə edir. Brendin mövqeləndirilməsinə rəhbərlik edir.',
    who: 'Türkan Agayeva', years: null,
    next_reqs: null
  },
  {
    key: 'BD-2', label: 'Junior Business Development Manager', az: 'BD Köməkçi Menecer',
    tag: 'Biznes inkişaf', color: '#0f2030', text: '#a8d0f0',
    desc: 'Potensial müştərilərin aşkarlanması, ilkin əlaqə qurulması, kommersiya təkliflərinin hazırlanmasında iştirak edir. BD Rəhbərinin birbaşa rəhbərliyi altında çalışır.',
    who: '— (gələcək kadr)', years: '1–3 il',
    next_reqs: 'Müstəqil müştəri əldə etmə · CRM idarəetməsi · Strateji tərəfdaşlıq qurma'
  },
]

const CAREER_PATH = [
  { key: 'L6', label: 'Architectural Assistant', years: '0–2 il', dot: '#2a1540', reqs: 'Memarlıq məzunu. Revit/AutoCAD baza biliyisi. Nəzarət altında çertyoj, model, sənəd işləri.' },
  { key: 'L5', label: 'Junior Architect', years: '2–4 il', dot: '#3a1f00', reqs: 'Layihənin bir hissəsini müstəqil idarə edir. İlk dəfə sifarişçi ilə birbaşa əlaqə. Texniki sənədləşdirmədə müstəqillik.' },
  { key: 'L4', label: 'Architect', years: '4–7 il', dot: '#2d3a00', reqs: 'Tam layihə məsuliyyəti. Peşəkar qeydiyyat (lisenziya). Müstəqil dizayn qərarları. Büdcə idarəetməsi başlayır.' },
  { key: 'L3', label: 'Project Architect', years: '7–12 il', dot: '#1a3d2e', reqs: 'Böyük layihə rəhbərliyi. Komanda idarəetməsi. Çoxsaylı paralel layihə. Podratçı münasibətlərinin tam idarəsi.' },
  { key: 'L2', label: 'Senior Associate', years: '12–18 il', dot: '#1a2744', reqs: 'Şirkətin texniki nüfuzunu daşıyır. Gənc mütəxəssislərin mentoru. Sifarişçilərlə strateji münasibət.' },
  { key: 'L1', label: 'Principal / Founding Partner', years: '18+ il', dot: '#0a0a0a', reqs: 'Şirkətin strateji istiqamətini müəyyənləşdirir. Dizayn nüfuzunu daşıyır. Şirkətin ümumi fəaliyyətinə cavabdehdir.' },
]

function LevelCard({ level }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden mb-2 border border-white/10">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        style={{ background: level.color }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[10px] font-bold tracking-wider min-w-[45px]" style={{ color: level.text, opacity: 0.65 }}>{level.key}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: level.text }}>{level.label}</div>
          <div className="text-[11px]" style={{ color: level.text, opacity: 0.7 }}>{level.az}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full mr-2" style={{ background: 'rgba(255,255,255,0.12)', color: level.text }}>{level.tag}</span>
        {open ? <IconChevronUp size={14} style={{ color: level.text, opacity: 0.6 }} /> : <IconChevronDown size={14} style={{ color: level.text, opacity: 0.6 }} />}
      </div>
      {open && (
        <div className="px-4 pb-3 pt-2" style={{ background: level.color }}>
          <p className="text-xs leading-relaxed mb-2" style={{ color: level.text, opacity: 0.8 }}>{level.desc}</p>
          {level.who && <div className="text-[11px] font-medium" style={{ color: level.text, opacity: 0.6 }}>👥 {level.who}</div>}
          {level.years && <div className="text-[11px] mt-1" style={{ color: level.text, opacity: 0.6 }}>⏱ {level.years} təcrübə</div>}
          {level.next_reqs && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-[10px] font-bold mb-1" style={{ color: level.text, opacity: 0.5 }}>BU SƏVİYYƏYƏ KEÇİD ÜÇÜN</div>
              <div className="text-[11px]" style={{ color: level.text, opacity: 0.7 }}>{level.next_reqs}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TABS = ['Tam struktur', 'Karyera yolu', 'Erkən yüksəliş']

export default function HierarchyPage() {
  const [tab, setTab] = useState(0)

  return (
    <div className="p-4 lg:p-6 fade-in">
      <div className="mb-5">
        <h1 className="text-base font-bold text-[#0f172a]">Karyera Strukturu</h1>
        <p className="text-xs text-[#888] mt-0.5">Reflect Architects — tam ierarxiya və inkişaf yolu</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${tab === i ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tam struktur */}
      {tab === 0 && (
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-3">Memarlıq bölməsi</div>
          {LEVELS.map(l => <LevelCard key={l.key} level={l} />)}

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#e8e8e4]" />
            <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Biznes inkişaf bölməsi</span>
            <div className="flex-1 h-px bg-[#e8e8e4]" />
          </div>
          {BD_LEVELS.map(l => <LevelCard key={l.key} level={l} />)}
        </div>
      )}

      {/* Karyera yolu */}
      {tab === 1 && (
        <div className="max-w-lg">
          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-4">Memarlıq karyera yolu</div>
            <div className="space-y-0">
              {CAREER_PATH.map((step, i) => (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: step.dot }} />
                    {i < CAREER_PATH.length - 1 && <div className="w-px flex-1 bg-[#e8e8e4] mt-1 mb-1" />}
                  </div>
                  <div className={`pb-4 ${i === CAREER_PATH.length - 1 ? '' : ''}`}>
                    <div className="text-xs font-bold text-[#0f172a]">{step.key} — {step.label}</div>
                    <div className="text-[10px] text-[#888] mt-0.5 mb-1">{step.years}</div>
                    <div className="text-[11px] text-[#555] leading-relaxed">{step.reqs}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Erkən yüksəliş */}
      {tab === 2 && (
        <div className="max-w-lg space-y-4">
          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-3">🚀 Erkən yüksəliş nədir?</div>
            <p className="text-xs text-[#555] leading-relaxed">
              Standart müddəti tamamlamadan əvvəl növbəti karyera səviyyəsinə yüksəlmə imkanıdır.
              Bu, yüksək performans göstərən əməkdaşlar üçün nəzərdə tutulmuşdur.
            </p>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-3">Meyarlar</div>
            <div className="space-y-3">
              {[
                { icon: '⭐', title: '2 ardıcıl il 4.5+/5.0 performans skoru', desc: '360° survey + rəhbər qiyməti + tapşırıq statistikası' },
                { icon: '✅', title: 'Rəhbər tövsiyəsi', desc: 'Birbaşa rəhbərin yazılı tövsiyəsi tələb olunur' },
                { icon: '📋', title: 'Növbəti səviyyə tələbləri', desc: 'Yüksəliş üçün müəyyənləşdirilmiş texniki meyarları qarşılamaq' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-[#0f172a]">{item.title}</div>
                    <div className="text-[11px] text-[#888] mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-3">Performans skoru necə hesablanır?</div>
            <div className="space-y-2">
              {[
                { label: '360° Survey', weight: '40%', color: '#0f172a', desc: 'Həmkarlar + rəhbər + özü — Google Forms' },
                { label: 'Rəhbər qiyməti', weight: '30%', color: '#1a3d2e', desc: 'Texniki keyfiyyət, müstəqillik, şirkətə töhfə' },
                { label: 'Tapşırıq statistikası', weight: '30%', color: '#1a2744', desc: 'Sistemdəki tapşırıq tamamlama faizi (avtomatik)' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: item.color }}>
                    {item.weight}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#0f172a]">{item.label}</div>
                    <div className="text-[11px] text-[#888]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
