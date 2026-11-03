import type { Task, TaskStatus, Priority } from './types'

export interface TaskFilters {
  query: string
  statuses: TaskStatus[]
  priorities: Priority[]
  specId: string | null
}

export const emptyFilters = (): TaskFilters => ({ query: '', statuses: [], priorities: [], specId: null })

/** Pesquisa por ID, título, conteúdo, arquivo, status, prioridade e dependência. */
export function matchesTask(t: Task, f: TaskFilters): boolean {
  if (f.statuses.length && !f.statuses.includes(t.status)) return false
  if (f.priorities.length && !f.priorities.includes(t.priority)) return false
  if (f.specId && t.specId !== f.specId) return false
  const q = f.query.trim().toLowerCase()
  if (!q) return true
  const hay = [t.id, t.title, t.description, t.notes ?? '', t.status, t.priority, t.specId, ...t.files, ...t.dependsOn, ...t.acceptance, ...t.specRefs]
  return hay.some((h) => h.toLowerCase().includes(q))
}
