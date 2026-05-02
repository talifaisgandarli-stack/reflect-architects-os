import { supabase } from './supabase'

/**
 * Log a task activity entry (status change, deadline change, assignment, etc.)
 * Stored in task_comments with type='activity' so the task timeline shows it.
 */
export async function logActivity(taskId, userId, action, metadata = {}) {
  const { error } = await supabase.from('task_comments').insert({
    task_id:   taskId,
    author_id: userId,
    type:      'activity',
    content:   action,
    metadata,
  })
  if (error) console.error('logActivity error:', error.message)
}
