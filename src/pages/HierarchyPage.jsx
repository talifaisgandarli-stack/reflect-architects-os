import { useState } from 'react'
import { Card } from '../components/ui'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'

const LEVELS = [
  {
    key: 'RA-1', label: 'Founding Partner — CEO & Chief Architect', az: 'Təsisçi Ortaq — CEO və Baş Memar',
    tag: 'Şirkət sahibi', color: '#0a0a0a', text: '#f5f5f0',
    desc: 'Şirkətin strateji istiqamətini və bədii vizyonunu müəyyənləşdirir. Ən mühüm dizayn qərarlarını qəbul edir. Şirkətin texniki və bədii nüfuzunu şəxsən daşıyır. Əsas sifarişçilərlə strateji münasibət qurur. Şirkətin maliyyə, hüquqi və idarəetmə məsələlərindən tam məsuldur.',
    years: null, next_reqs: null, reqs_detail: null
  },
  {
    key: 'RA-2', label: 'Partner', az: 'Ortaq',
    tag: 'Ortaq səviyyəsi', color: '#1c1c1c', text: '#e8e8e0',
    desc: 'Şirkətin müəyyən bir sahəsinin — layihə portfeli, biznes inkişaf və ya əməliyyat — strateji rəhbərliyini həyata keçirir. CEO ilə birgə şirkətin inkişaf strategiyasını formalaşdırır. Böyük sifarişçi münasibətlərini şəxsən idarə edir. Şirkətin uzunmüddətli gəlirliliyinə cavabdehdir.',
    years: null,
    next_reqs: 'Partner olmaq üçün:',
    reqs_detail: [
      '📁 Portfolio — ən azı 5 böyük layihəni başdan sona müstəqil rəhbərlik edib tamamlamaq; bu layihələrdən ən azı biri şirkətin portfoliosuna dəyər katan olmalıdır (mükafat, media, güclü referans)',
      '💼 Biznes töhfəsi — ən azı 2–3 yeni sifarişçi gətirib aktiv layihəyə çevirmək; şirkətin gəlir artımına ölçülə bilən töhfə vermək',
      '👥 Komanda liderliyi — ən azı 3–5 işçinin mentoru olmaq və onları növbəti karyera səviyyəsinə çatdırmaq; komanda mədəniyyətini qorumaq və yaymaq',
      '🌐 Brend və nüfuz — şirkəti peşəkar icmada təmsil etmək (konfrans, nəşr, mükafat); sektorda şəxsi tanınma qazanmaq',
      '📊 Maliyyə savadlılığı — layihə büdcələrini idarə etmək, müqavilə şərtlərini müstəqil danışmaq, şirkətin maliyyə sağlamlığına məsuliyyət daşımaq',
      '🎯 Dəyər uyğunluğu — şirkətin dizayn fəlsəfəsini tam qəbul etmək; uzunmüddətli öhdəlik və şirkətin gələcəyinə inanc',
    ]
  },
  {
    key: 'L2', label: 'Senior Associate', az: 'Baş Əməkdaş',
    tag: 'Texniki rəhbər', color: '#1a2744', text: '#dce8ff',
    desc: 'Böyük miqyaslı layihələri tam müstəqillikdə idarə edir. Dizayn keyfiyyətinə şəxsən cavabdehdir. Sifarişçi ilə bütün texniki məsələləri aparır. Gənc mütəxəssislərin mentoru funksiyasını daşıyır.',
    years: '10+ il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Şirkətin texniki nüfuzunu daşımaq qabiliyyəti — müstəqil dizayn imzası',
      'Ən azı 3 böyük layihənin tam rəhbərliyini uğurla tamamlamaq',
      'Komanda qurma və mentorluq təcrübəsi — ən azı 2 işçinin inkişafına töhfə',
      'Sifarişçilərlə strateji səviyyəli əlaqə qurmaq bacarığı',
      '2 ardıcıl il 4.5+/5.0 performans skoru',
    ]
  },
  {
    key: 'L3', label: 'Project Architect', az: 'Layihə Memarı',
    tag: 'Layihə rəhbəri', color: '#1a3d2e', text: '#d0f0e0',
    desc: 'Müstəqil olaraq tam layihə dövrünü idarə edir — konseptdən müəllif nəzarətinə qədər. Podratçı münasibətlərini koordinasiya edir. İşçi sənədlərin keyfiyyətinə şəxsən cavabdehdir. Layihə büdcəsini izləyir.',
    years: '6–10 il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Ən azı 2 böyük, tam layihə dövrünü (konseptdən tikintiyə) müstəqil tamamlamaq',
      'Komandanı idarə etmək — junior əməkdaşlara rəhbərlik təcrübəsi',
      'Çoxsaylı paralel layihəni eyni vaxtda idarə etmək bacarığı',
      'Podratçı münasibətlərini müstəqil aparma — müqavilə, nəzarət, hesabat',
      'Büdcə idarəetməsi — layihə xərclərini planlaşdırmaq və nəzarət etmək',
      '2 ardıcıl il 4.5+/5.0 performans skoru',
    ]
  },
  {
    key: 'L4', label: 'Architect', az: 'Memar',
    tag: 'Müstəqil mütəxəssis', color: '#2d3a00', text: '#eaf0b0',
    desc: 'Layihənin müəyyən hissəsini tam müstəqillikdə idarə edir. Texniki həlləri özü işləyib hazırlayır. Sınaq mərhələsindən uğurla keçib öz peşəkar üslubunu formalaşdırmışdır. Sifarişçi ilə birbaşa işləyir.',
    years: '3–6 il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Layihənin tam bir hissəsini (məs: tam interior, tam fasad, tam texniki sənəd paketi) müstəqil tamamlamaq',
      'Sifarişçi ilə müstəqil işləmək bacarığı — görüşlər, təqdimatlar, texniki müzakirələr',
      'Müstəqil texniki qərar qəbulu — rəhbər müdaxiləsi minimal olmalıdır',
      'Revit / AutoCAD — peşəkar səviyyə, sənəd standartlarına tam riayət',
      'Ən azı 1 layihənin tikinti nəzarəti mərhələsini müşayiət etmək',
      '2 ardıcıl il 4.5+/5.0 performans skoru',
    ]
  },
  {
    key: 'L5', label: 'Junior Architect', az: 'Kiçik Memar',
    tag: 'İnkişaf edən', color: '#3a1f00', text: '#f5ddb0',
    desc: 'Baş memar və ya layihə memarının rəhbərliyi altında çalışır. Çertyoj, texniki sənəd, koordinasiya işlərini aparır. Müstəqil qərar qəbulundan əvvəlki formalaşma mərhələsidir.',
    years: '1–3 il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Layihənin kiçik bir hissəsini nəzarət altında müstəqil tamamlamaq',
      'Sifarişçi ilə ilk birbaşa əlaqə — rəhbər iştirakı ilə görüşlər',
      'Texniki sənədləşdirmədə müstəqillik — şablonlara ehtiyac olmadan',
      'Revit / AutoCAD — orta-yüksək səviyyə, şirkətin standartlarına uyğun iş',
      'Vaxtında çatdırma qabiliyyəti — deadline-lara sistemli riayət',
      '2 ardıcıl il 4.5+/5.0 performans skoru',
    ]
  },
  {
    key: 'L6', label: 'Architectural Assistant', az: 'Memar Köməkçisi',
    tag: 'Başlanğıc', color: '#2a1540', text: '#e8d0ff',
    desc: 'Rəsmi memarlıq təhsili olan, lakin hələ peşəkar qeydiyyatını tamamlamamış kadr. Bütün texniki işlərdə köməkçi funksiya daşıyır. Şirkətin gələcək potensialını formalaşdırır.',
    years: '0–1 il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Memarlıq ixtisası üzrə ali təhsil (bakalavr və ya magistr)',
      'Revit / AutoCAD — baza biliyisi, nəzarət altında iş',
      'Şirkətin daxili standartlarını öyrənmək və tətbiq etmək',
      'Verilən tapşırıqları vaxtında və keyfiyyətlə tamamlamaq',
      'Komanda mühitinə uyğunlaşma və öyrənməyə açıqlıq',
    ]
  },
]

const BD_LEVELS = [
  {
    key: 'BD-1', label: 'Head of Business Development & Community', az: 'Biznes İnkişaf və İcma Rəhbəri',
    tag: 'Direktor səviyyəsi', color: '#1a3040', text: '#c0e0f8',
    desc: 'Şirkətin yeni müştəri axınını, strateji tərəfdaşlıqlarını və ictimai nüfuzunu idarə edir. Brendin mövqeləndirilməsinə rəhbərlik edir. Peşəkar icmada şirkəti təmsil edir.',
    years: null, next_reqs: null, reqs_detail: null
  },
  {
    key: 'BD-2', label: 'Junior Business Development Manager', az: 'BD Köməkçi Menecer',
    tag: 'Biznes inkişaf', color: '#0f2030', text: '#a8d0f0',
    desc: 'Potensial müştərilərin aşkarlanması, ilkin əlaqə qurulması, kommersiya təkliflərinin hazırlanmasında iştirak edir. BD Rəhbərinin birbaşa rəhbərliyi altında çalışır.',
    years: '1–3 il',
    next_reqs: 'Bu səviyyəyə keçid üçün:',
    reqs_detail: [
      'Müstəqil müştəri əldə etmə — ən azı 2 aktiv layihə gətirmək',
      'CRM idarəetməsi — pipeline-ı sistemli aparmaq',
      'Strateji tərəfdaşlıq qurma bacarığı',
      'Kommersiya təkliflərini müstəqil hazırlamaq',
      '2 ardıcıl il 4.5+/5.0 performans skoru',
    ]
  },
]

const CAREER_PATH = [
  { key: 'L6', label: 'Architectural Assistant', years: '0–1 il', dot: '#2a1540', reqs: 'Memarlıq məzunu. Revit/AutoCAD baza biliyisi. Nəzarət altında çertyoj, model, sənəd işləri.' },
  { key: 'L5', label: 'Junior Architect', years: '1–3 il', dot: '#3a1f00', reqs: 'Layihənin bir hissəsini nəzarət altında müstəqil idarə edir. İlk dəfə sifarişçi ilə birbaşa əlaqə. Texniki sənədləşdirmədə müstəqillik.' },
  { key: 'L4', label: 'Architect', years: '3–6 il', dot: '#2d3a00', reqs: 'Tam layihə məsuliyyəti. Müstəqil dizayn qərarları. Büdcə idarəetməsi başlayır. Sifarişçi ilə müstəqil iş.' },
  { key: 'L3', label: 'Project Architect', years: '6–10 il', dot: '#1a3d2e', reqs: 'Böyük layihə rəhbərliyi. Komanda idarəetməsi. Çoxsaylı paralel layihə. Podratçı münasibətlərinin tam idarəsi.' },
  { key: 'L2', label: 'Senior Associate', years: '10+ il', dot: '#1a2744', reqs: 'Şirkətin texniki nüfuzunu daşıyır. Gənc mütəxəssislərin mentoru. Sifarişçilərlə strateji münasibət.' },
  { key: 'RA-2', label: 'Partner', years: '—', dot: '#1c1c1c', reqs: 'Şirkətin müəyyən bir sahəsinin strateji rəhbərliyi. CEO ilə birgə inkişaf strategiyası. Biznes töhfəsi və komanda liderliyi.' },
  { key: 'RA-1', label: 'Founding Partner — CEO & Chief Architect', years: '—', dot: '#0a0a0a', reqs: 'Şirkətin strateji istiqamətini müəyyənləşdirir. Tam idarəetmə məsuliyyəti. Bədii vizyon.' },
]

function LevelCard({ level }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ background: level.color }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[10px] font-bold tracking-widest min-w-[48px]" style={{ color: level.text, opacity: 0.5 }}>{level.key}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: level.text }}>{level.label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: level.text, opacity: 0.65 }}>{level.az}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:block" style={{ background: 'rgba(255,255,255,0.12)', color: level.text }}>{level.tag}</span>
          {open ? <IconChevronUp size={14} style={{ color: level.text, opacity: 0.45 }} /> : <IconChevronDown size={14} style={{ color: level.text, opacity: 0.45 }} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ background: level.color }}>
          <p className="text-xs leading-relaxed" style={{ color: level.text, opacity: 0.82 }}>{level.desc}</p>
          {level.years && (
            <div className="text-[11px]" style={{ color: level.text, opacity: 0.55 }}>⏱ {level.years} təcrübə</div>
          )}
          {level.reqs_detail && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: level.text, opacity: 0.5 }}>
                {level.next_reqs}
              </div>
              <div className="space-y-2.5">
                {level.reqs_detail.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[11px] leading-relaxed" style={{ color: level.text, opacity: 0.78 }}>{req}</span>
                  </div>
                ))}
              </div>
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

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${tab === i ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* TAM STRUKTUR */}
      {tab === 0 && (
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-3 px-1">Memarlıq bölməsi</div>
          {LEVELS.map(l => <LevelCard key={l.key} level={l} />)}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#e8e8e4]" />
            <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest whitespace-nowrap">Biznes inkişaf bölməsi</span>
            <div className="flex-1 h-px bg-[#e8e8e4]" />
          </div>
          {BD_LEVELS.map(l => <LevelCard key={l.key} level={l} />)}
        </div>
      )}

      {/* KARYERA YOLU */}
      {tab === 1 && (
        <div className="max-w-lg">
          <Card className="p-5">
            <div className="text-xs font-bold text-[#0f172a] mb-5">Memarlıq karyera yolu</div>
            <div>
              {CAREER_PATH.map((step, i) => (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-white" style={{ background: step.dot }} />
                    {i < CAREER_PATH.length - 1 && (
                      <div className="w-px flex-1 mt-1 mb-1" style={{ background: step.dot, opacity: 0.2 }} />
                    )}
                  </div>
                  <div className={`pb-5 ${i === CAREER_PATH.length - 1 ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: step.dot }}>{step.key}</span>
                      <span className="text-xs font-bold text-[#0f172a]">{step.label}</span>
                    </div>
                    <div className="text-[10px] text-[#aaa] mb-1">{step.years}</div>
                    <div className="text-[11px] text-[#555] leading-relaxed">{step.reqs}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ERKƏN YÜKSƏLİŞ */}
      {tab === 2 && (
        <div className="max-w-lg space-y-4">
          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-2">🚀 Erkən yüksəliş nədir?</div>
            <p className="text-xs text-[#555] leading-relaxed">
              Standart müddəti tamamlamadan əvvəl növbəti karyera səviyyəsinə yüksəlmə imkanıdır.
              Yüksək performans göstərən əməkdaşlar üçün nəzərdə tutulmuşdur.
              2 ardıcıl ildə yüksək skor əldə edən işçilər bu hüququ qazanır.
            </p>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-3">Meyarlar</div>
            <div className="space-y-3">
              {[
                { icon: '⭐', title: '2 ardıcıl il 4.5+/5.0 performans skoru', desc: '360° survey + rəhbər qiyməti + tapşırıq statistikasının ağırlıqlı ortalaması' },
                { icon: '✅', title: 'Rəhbər tövsiyəsi', desc: 'Birbaşa rəhbərin yazılı tövsiyəsi — əməkdaşın növbəti səviyyəyə hazır olduğunu təsdiqləyir' },
                { icon: '📋', title: 'Növbəti səviyyənin texniki tələbləri', desc: '"Tam struktur" tabında hər səviyyə üçün göstərilən meyarların qarşılanması' },
                { icon: '📅', title: 'Minimum 1 il cari səviyyədə iş', desc: 'Erkən yüksəliş belə, ən azı 1 il cari vəzifədə olmağı tələb edir' },
              ].map(item => (
                <div key={item.title} className="flex gap-3 pb-3 border-b border-[#f5f5f0] last:border-0 last:pb-0">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-[#0f172a]">{item.title}</div>
                    <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[#0f172a] mb-3">Performans skoru necə hesablanır?</div>
            <div className="space-y-2.5">
              {[
                { label: '360° Survey', weight: '40%', color: '#0f172a', desc: 'Həmkarlar + rəhbər + özü — Google Forms vasitəsilə ildə bir dəfə' },
                { label: 'Rəhbər qiyməti', weight: '30%', color: '#1a3d2e', desc: 'Texniki keyfiyyət, müstəqillik, şirkətə töhfə — ildə bir dəfə admin daxil edir' },
                { label: 'Tapşırıq statistikası', weight: '30%', color: '#1a2744', desc: 'Tapşırıq tamamlama faizi — sistem avtomatik hesablayır' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style={{ background: item.color }}>
                    {item.weight}
                  </div>
                  <div className="pt-0.5">
                    <div className="text-xs font-medium text-[#0f172a]">{item.label}</div>
                    <div className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#f0f0ec]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#888]">Erkən yüksəliş hüququ üçün minimum:</span>
                <span className="font-bold text-green-600">4.5 / 5.0</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-[#888]">2 ardıcıl ildə bu skoru saxlamaq lazımdır</span>
                <span className="font-bold text-[#0f172a]">→ 🚀</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
