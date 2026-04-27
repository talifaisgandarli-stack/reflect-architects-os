import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconStar, IconTrendingUp } from '@tabler/icons-react'

function fmt1(n) { return Number(n || 0).toFixed(1) }

function ScoreBar({ value, max = 5, color = '#0f172a' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-[#0f172a] w-8 text-right">{fmt1(value)}</span>
    </div>
  )
}

function ReviewForm({ open, onClose, onSave, review, members }) {
  const [form, setForm] = useState({
    employee_id: '', review_year: new Date().getFullYear(),
    survey_360: '', manager_score: '', notes: '', reviewed_by: ''
  })

  useEffect(() => {
    if (review) {
      setForm({
        employee_id: review.employee_id || '',
        review_year: review.review_year || new Date().getFullYear(),
        survey_360: review.survey_360 || '',
        manager_score: review.manager_score || '',
        notes: review.notes || '',
        reviewed_by: review.reviewed_by || ''
      })
    } else {
      setForm({ employee_id: '', review_year: new Date().getFullYear(), survey_360: '', manager_score: '', notes: '', reviewed_by: '' })
    }
  }, [review, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  // Tapşırıq skoru avtomatik hesablanacaq — hər üçünün ortalama
  const survey = Number(form.survey_360) || 0
  const manager = Number(form.manager_score) || 0

  // Tapşırıq skoru üçün member-in statistikasını gostermek üçün placeholder
  const taskScore = 0 // Real hesablamada Supabase-dən gəlir

  // Ağırlıqlı ortalama: survey 40%, manager 30%, task 30%
  const total = survey && manager
    ? Math.round(((survey * 0.4) + (manager * 0.3) + (taskScore * 0.3)) * 10) / 10
    : null

  const scoreColor = (s) => s >= 4.5 ? '#16a34a' : s >= 3.5 ? '#ca8a04' : '#dc2626'

  return (
    <Modal open={open} onClose={onClose} title={review ? 'Qiymətləndirməni redaktə et' : 'Yeni performans qiymətləndirməsi'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşçi *</label>
            <select value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              disabled={!!review}>
              <option value="">Seçin</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İl *</label>
            <select value={form.review_year} onChange={e => set('review_year', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="border border-[#e8e8e4] rounded-xl p-4 space-y-4">
          <div className="text-xs font-bold text-[#0f172a]">Performans balları (5 üzərindən)</div>

          {/* 360° Survey */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-[#0f172a]">360° Survey nəticəsi</div>
                <div className="text-[10px] text-[#888]">Google Forms nəticəsi · Çəki: 40%</div>
              </div>
              <span className="text-[10px] text-[#aaa]">5 üzərindən</span>
            </div>
            <input type="number" min="0" max="5" step="0.1" value={form.survey_360}
              onChange={e => set('survey_360', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0.0 – 5.0" />
            {survey > 0 && <ScoreBar value={survey} color={scoreColor(survey)} />}
          </div>

          {/* Rəhbər qiyməti */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-[#0f172a]">Rəhbər qiymətləndirməsi</div>
                <div className="text-[10px] text-[#888]">Texniki keyfiyyət, müstəqillik, töhfə · Çəki: 30%</div>
              </div>
              <span className="text-[10px] text-[#aaa]">5 üzərindən</span>
            </div>
            <input type="number" min="0" max="5" step="0.1" value={form.manager_score}
              onChange={e => set('manager_score', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0.0 – 5.0" />
            {manager > 0 && <ScoreBar value={manager} color={scoreColor(manager)} />}
          </div>

          {/* Tapşırıq statistikası */}
          <div className="bg-[#f5f5f0] rounded-lg p-3">
            <div className="text-xs font-medium text-[#0f172a] mb-1">Tapşırıq statistikası (avtomatik) · Çəki: 30%</div>
            <div className="text-[10px] text-[#888]">Sistem tapşırıq tamamlama faizini avtomatik hesablayır.</div>
          </div>

          {/* Ümumi skor preview */}
          {total && (
            <div className={`rounded-xl p-3 text-center ${total >= 4.5 ? 'bg-green-50 border border-green-200' : total >= 3.5 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-xs text-[#888] mb-0.5">Proqnoz ümumi skor (tapşırıq skoru olmadan)</div>
              <div className="text-2xl font-bold" style={{ color: scoreColor(total) }}>{fmt1(total)} / 5.0</div>
              {total >= 4.5 && <div className="text-xs text-green-700 mt-1">🚀 Erkən yüksəliş hüququ əldə edə bilər!</div>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Rəhbər qeydi</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Bu il əsas nailiyyətlər, inkişaf sahələri..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qiymətləndirən</label>
          <input value={form.reviewed_by} onChange={e => set('reviewed_by', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Rəhbərin adı" />
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form, total)} className="ml-auto">
            {review ? 'Yadda saxla' : 'Qiymətləndir'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PerformansPage() {
  const { addToast } = useToast()
  const { isAdmin, user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editReview, setEditReview] = useState(null)
  const [deleteReview, setDeleteReview] = useState(null)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    let reviewQuery = supabase.from('performance_reviews')
      .select('*, profiles(full_name, career_level)')
      .order('review_year', { ascending: false })
    if (!isAdmin) reviewQuery = reviewQuery.eq('employee_id', user?.id)

    const [rRes, mRes] = await Promise.all([
      reviewQuery,
      supabase.from('profiles').select('id, full_name, career_level').eq('is_active', true).order('full_name'),
    ])
    setReviews(rRes.data || [])
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function calcTaskScore(employeeId, year) {
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    const { data: tasks } = await supabase.from('tasks')
      .select('status, due_date, updated_at')
      .eq('assignee_id', employeeId)
      .gte('created_at', start).lte('created_at', end)

    if (!tasks || tasks.length === 0) return 3.0 // Default

    const done = tasks.filter(t => t.status === 'done').length
    const total = tasks.filter(t => t.status !== 'cancelled').length
    if (total === 0) return 3.0

    const completionRate = done / total
    // Tapşırıq completion rate-ni 5-lik skala üzrə çevir
    return Math.min(5, Math.round(completionRate * 5 * 10) / 10)
  }

  async function handleSave(form, previewTotal) {
    if (!form.employee_id || !form.review_year) { addToast('İşçi və il seçin', 'error'); return }

    const survey = Number(form.survey_360) || 0
    const manager = Number(form.manager_score) || 0

    // Tapşırıq skoru hesabla
    const taskScore = await calcTaskScore(form.employee_id, form.review_year)
    const total = Math.round(((survey * 0.4) + (manager * 0.3) + (taskScore * 0.3)) * 10) / 10

    const data = {
      employee_id: form.employee_id,
      review_year: form.review_year,
      survey_360: survey || null,
      manager_score: manager || null,
      task_score: taskScore,
      total_score: total,
      notes: form.notes || null,
      reviewed_by: form.reviewed_by || null,
    }

    if (editReview) {
      const { error } = await supabase.from('performance_reviews').update(data).eq('id', editReview.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    } else {
      const { error } = await supabase.from('performance_reviews').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    }

    // Əgər 2 ardıcıl il 4.5+ bal varsa — promotion_eligible = true
    const { data: allReviews } = await supabase.from('performance_reviews')
      .select('review_year, total_score')
      .eq('employee_id', form.employee_id)
      .order('review_year', { ascending: false })
      .limit(2)

    if (allReviews && allReviews.length >= 2) {
      const eligible = allReviews[0].total_score >= 4.5 && allReviews[1].total_score >= 4.5
      await supabase.from('profiles').update({ promotion_eligible: eligible }).eq('id', form.employee_id)
    } else if (allReviews && allReviews.length === 1 && total >= 4.5) {
      // İlk il 4.5+ — hələ eligible deyil amma qeyd et
    }

    addToast('Qiymətləndirmə saxlanıldı', 'success')
    setModalOpen(false); setEditReview(null)
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('performance_reviews').delete().eq('id', deleteReview.id)
    addToast('Silindi', 'success')
    setDeleteReview(null); await loadData()
  }

  const scoreColor = (s) => s >= 4.5 ? 'success' : s >= 3.5 ? 'warning' : 'danger'
  const scoreText = (s) => s >= 4.5 ? 'text-green-600' : s >= 3.5 ? 'text-amber-600' : 'text-red-600'

  const filtered = reviews.filter(r => r.review_year === filterYear)
  const avgScore = filtered.length > 0
    ? filtered.reduce((s, r) => s + (r.total_score || 0), 0) / filtered.length
    : 0
  const eligible = filtered.filter(r => r.total_score >= 4.5).length

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  // İşçi üçün şəxsi görünüş
  if (!isAdmin) {
    return (
      <div className="p-4 lg:p-6 fade-in">
        <div className="mb-5">
          <h1 className="text-base font-bold text-[#0f172a]">Mənim Performansım</h1>
          <p className="text-xs text-[#888] mt-0.5">İllik 360° survey + rəhbər + tapşırıq statistikası</p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16 text-[#aaa] text-sm">
            <div className="text-4xl mb-3">📊</div>
            <div>Hələ performans qiymətləndirməniz yoxdur</div>
            <div className="text-xs mt-1">Rəhbərinizlə əlaqə saxlayın</div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {reviews.map(r => {
              const scoreColor = r.total_score >= 4.5 ? '#16a34a' : r.total_score >= 3.5 ? '#ca8a04' : '#dc2626'
              return (
                <div key={r.id} className="bg-white border border-[#e8e8e4] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-[#0f172a]">{r.review_year} ili</div>
                      <div className="text-xs text-[#888] mt-0.5">{r.reviewed_by ? `Qiymətləyən: ${r.reviewed_by}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black" style={{ color: scoreColor }}>{fmt1(r.total_score)}</div>
                      <div className="text-[10px] text-[#aaa]">/ 5.0 bal</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: '360° Survey', value: r.survey_360, weight: '40%' },
                      { label: 'Rəhbər qiyməti', value: r.manager_score, weight: '30%' },
                      { label: 'Tapşırıq statistikası', value: r.task_score, weight: '30%' },
                    ].map(item => item.value != null && (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#555]">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#aaa]">{item.weight}</span>
                            <span className="text-xs font-bold text-[#0f172a]">{fmt1(item.value)}/5.0</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / 5) * 100}%`, background: scoreColor }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.notes && (
                    <div className="mt-4 pt-3 border-t border-[#f0f0ec]">
                      <div className="text-[10px] text-[#aaa] mb-1 uppercase tracking-wider">Rəhbər qeydi</div>
                      <p className="text-xs text-[#555] leading-relaxed">{r.notes}</p>
                    </div>
                  )}

                  {r.total_score >= 4.5 && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
                      🚀 Erkən yüksəliş hüququ qazanıldı!
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Performans Qiymətləndirməsi"
        subtitle="İllik 360° survey + rəhbər + tapşırıq statistikası"
        action={isAdmin ? (
          <Button onClick={() => { setEditReview(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Yeni qiymətləndirmə
          </Button>
        ) : null}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Qiymətləndirilən" value={filtered.length} />
        <StatCard label="Orta skor" value={`${fmt1(avgScore)}/5.0`} />
        <StatCard label="4.5+ bal" value={eligible} variant="success" />
        <StatCard label="Erkən yüksəliş hüququ" value={members.filter(m => m.promotion_eligible).length} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e8e4]">
                <th className="text-left px-4 py-3 font-medium text-[#888]">İşçi</th>
                <th className="text-left px-4 py-3 font-medium text-[#888]">Səviyyə</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">360° Survey</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Rəhbər</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Tapşırıq</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Ümumi</th>
                <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-[#aaa]">Bu il üçün qiymətləndirmə yoxdur</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0f172a]">{r.profiles?.full_name}</div>
                    {r.reviewed_by && <div className="text-[10px] text-[#aaa]">Qiymətləyən: {r.reviewed_by}</div>}
                  </td>
                  <td className="px-4 py-3 text-[#555]">{r.profiles?.career_level || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {r.survey_360 ? <span className={scoreText(r.survey_360)}>{fmt1(r.survey_360)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.manager_score ? <span className={scoreText(r.manager_score)}>{fmt1(r.manager_score)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.task_score ? <span className={scoreText(r.task_score)}>{fmt1(r.task_score)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconStar size={10} className="text-yellow-500" />
                      <span className={`font-bold ${scoreText(r.total_score)}`}>{fmt1(r.total_score)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.total_score >= 4.5
                      ? <Badge variant="success" size="sm">🚀 Erkən yüksəliş</Badge>
                      : r.total_score >= 3.5
                      ? <Badge variant="warning" size="sm">Yaxşı</Badge>
                      : <Badge variant="danger" size="sm">İnkişaf lazımdır</Badge>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditReview(r); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                        <button onClick={() => setDeleteReview(r)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ReviewForm open={modalOpen} onClose={() => { setModalOpen(false); setEditReview(null) }}
        onSave={handleSave} review={editReview} members={members} />
      <ConfirmDialog open={!!deleteReview} title="Qiymətləndirməni sil"
        message="Bu qiymətləndirməni silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete} onCancel={() => setDeleteReview(null)} danger />
    </div>
  )
}
