import { isBlockedByDependency, isSpecified } from './dependencies'
import type { Spec, Task, TaskStatus } from './types'
import { TASK_STATUSES } from './types'

export interface Metrics {
  totalSpecs: number
  incompleteSpecs: number
  totalTasks: number
  byStatus: Record<TaskStatus, number>
  /** Prontas para IA: status `ready` e suficientemente especificadas. */
  readyForAi: number
  done: number
  blockedExplicit: number
  blockedByDependency: number
  withoutAcceptance: number
  /** Tarefas suficientemente especificadas / total (cobertura do planejamento). */
  planningCoverage: number
  /** Tarefas `done` / total identificado (progresso documental, NÃO comprova execução). */
  documentalProgress: number
  /** Tarefas fora da linha de base, se houver baseline. */
  addedAfterBaseline: number | null
  /** Aviso quando 100% não é conclusivo. */
  caveat?: string
}

/**
 * Fórmulas:
 *  - planningCoverage = tarefas especificadas (critérios de aceite + spec_ref/arquivo) / total de tarefas
 *  - documentalProgress = tarefas com status `done` / total de tarefas identificadas
 *  - Spec incompleta = Spec sem requisitos, sem critérios de aceite, sem tarefas, ou com tarefa não especificada
 */
export function computeMetrics(specs: Spec[], tasks: Task[], baseline?: string[]): Metrics {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>
  for (const t of tasks) byStatus[t.status]++
  const total = tasks.length
  const specified = tasks.filter(isSpecified).length
  const incompleteSpecs = specs.filter((s) => {
    const own = tasks.filter((t) => t.specId === s.id)
    return s.requirements.length === 0 || s.acceptanceCriteria.length === 0 || own.length === 0 || own.some((t) => !isSpecified(t))
  }).length
  const documentalProgress = total ? byStatus.done / total : 0
  const m: Metrics = {
    totalSpecs: specs.length,
    incompleteSpecs,
    totalTasks: total,
    byStatus,
    readyForAi: tasks.filter((t) => t.status === 'ready' && isSpecified(t)).length,
    done: byStatus.done,
    blockedExplicit: byStatus.blocked,
    blockedByDependency: tasks.filter((t) => isBlockedByDependency(t, byId)).length,
    withoutAcceptance: tasks.filter((t) => t.acceptance.length === 0).length,
    planningCoverage: total ? specified / total : 0,
    documentalProgress,
    addedAfterBaseline: baseline ? tasks.filter((t) => !baseline.includes(t.id)).length : null,
  }
  if (documentalProgress === 1 && incompleteSpecs > 0)
    m.caveat = 'Todas as tarefas identificadas estão done, mas há Specs incompletas: o escopo pode crescer.'
  return m
}
