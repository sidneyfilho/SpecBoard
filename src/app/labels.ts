import { TASK_PRIORITIES, TASK_STATUSES, type Priority, type SpecStatus, type TaskStatus } from '@/domain/types'

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  backlog: { label: 'Backlog', color: 'grey', icon: 'mdi-circle-outline' },
  ready: { label: 'Pronto para IA', color: 'success', icon: 'mdi-check-circle-outline' },
  in_progress: { label: 'Em execução (manual)', color: 'warning', icon: 'mdi-progress-clock' },
  review: { label: 'Em revisão', color: 'secondary', icon: 'mdi-eye-outline' },
  done: { label: 'Concluído', color: 'info', icon: 'mdi-check-all' },
  blocked: { label: 'Bloqueado', color: 'error', icon: 'mdi-alert-circle-outline' },
}

export const SPEC_STATUS_META: Record<SpecStatus, { label: string; color: string; icon: string }> = {
  backlog: { label: 'Backlog', color: 'grey', icon: 'mdi-circle-outline' },
  planning: { label: 'Em planejamento', color: 'primary', icon: 'mdi-pencil-ruler' },
  ready: { label: 'Pronta para IA', color: 'success', icon: 'mdi-check-circle-outline' },
  in_progress: { label: 'Em execução (manual)', color: 'warning', icon: 'mdi-progress-clock' },
  review: { label: 'Em revisão', color: 'secondary', icon: 'mdi-eye-outline' },
  done: { label: 'Concluída', color: 'info', icon: 'mdi-check-all' },
  blocked: { label: 'Bloqueada', color: 'error', icon: 'mdi-alert-circle-outline' },
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: 'baixa', color: 'success' },
  medium: { label: 'média', color: 'warning' },
  high: { label: 'alta', color: 'error' },
  critical: { label: 'crítica', color: 'purple' },
}

export const NAV = [
  { to: '/', title: 'Visão Geral', icon: 'mdi-home-variant-outline' },
  { to: '/specs', title: 'Especificações', icon: 'mdi-file-document-outline' },
  { to: '/tasks', title: 'Tarefas', icon: 'mdi-format-list-checks' },
  { to: '/kanban', title: 'Kanban', icon: 'mdi-view-column-outline' },
  { to: '/schedule', title: 'Cronograma', icon: 'mdi-calendar-month-outline' },
  { to: '/dependencies', title: 'Dependências', icon: 'mdi-graph-outline' },
  { to: '/files', title: 'Arquivos', icon: 'mdi-folder-outline' },
  { to: '/reports', title: 'Relatórios', icon: 'mdi-chart-box-outline' },
  { to: '/settings', title: 'Configurações', icon: 'mdi-cog-outline' },
] as const

export const TASK_STATUS_ITEMS = TASK_STATUSES.map((s) => ({ title: TASK_STATUS_META[s].label, value: s }))
export const PRIORITY_ITEMS = TASK_PRIORITIES.map((p) => ({ title: PRIORITY_META[p].label, value: p }))
