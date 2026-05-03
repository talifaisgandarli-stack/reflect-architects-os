import { supabase } from './supabase'

/**
 * Log a task activity entry to the task timeline.
 * Stored in task_comments with type='activity'.
 *
 * @param {string} taskId
 * @param {string} userId  — author_id (current user)
 * @param {string} action  — human-readable AZ string, e.g. 'status dəyişdi: hazırlanır → tamamlandı'
 * @param {object} metadata — optional structured data, e.g. { old_status, new_status }
 */
export async function logActivity(taskId, userId, action, metadata = {}) {
  if (!taskId || !userId) return
  const { error } = await supabase.from('task_comments').insert({
    task_id:   taskId,
    author_id: userId,
    type:      'activity',
    content:   String(action).slice(0, 500),
    metadata,
  })
  if (error) console.error('[logActivity] error:', error.message)
}

// ── Common activity messages (Azerbaijani) ────────────────────────────────────

export const act = {
  created:     ()            => 'tapşırıq yaradıldı',
  statusChange:(from, to)    => `status dəyişdi: ${from} → ${to}`,
  deadlineSet: (date)        => `deadline: ${date}`,
  deadlineChanged:(from, to) => `deadline dəyişdi: ${from} → ${to}`,
  assigned:    (name)        => `cavabdeh: ${name}`,
  assignedMany:(names)       => `cavabdehlər: ${names.join(', ')}`,
  prioritySet: (p)           => `prioritet: ${p}`,
  subtaskDone: (title)       => `alt tapşırıq tamamlandı: ${title}`,
  subtaskAdd:  (title)       => `alt tapşırıq əlavə edildi: ${title}`,
  archived:    ()            => 'arxivə köçürüldü',
  unarchived:  ()            => 'arxivdən çıxarıldı',
  hidden:      ()            => 'gizlədildi',
  unhidden:    ()            => 'göründü',
  tagAdded:    (tag)         => `etiket əlavə edildi: ${tag}`,
  tagRemoved:  (tag)         => `etiket silindi: ${tag}`,
  note:        (msg)         => msg,
}
