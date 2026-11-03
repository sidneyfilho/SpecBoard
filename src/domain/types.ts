export const TASK_STATUSES = ['backlog', 'ready', 'in_progress', 'review', 'done', 'blocked'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type Priority = (typeof TASK_PRIORITIES)[number]

export const SPEC_STATUSES = ['backlog', 'planning', 'ready', 'in_progress', 'review', 'done', 'blocked'] as const
export type SpecStatus = (typeof SPEC_STATUSES)[number]

export interface Project {
  id: string
  name: string
  description: string
  repositoryRoot: string
  specsDirectory: string
  constitutionPath?: string
  agentInstructionsPath?: string
}

export interface Requirement {
  id: string
  text: string
}

export interface AcceptanceCriterion {
  text: string
  checked: boolean
}

export interface Spec {
  id: string
  title: string
  status: SpecStatus
  priority: Priority
  objective: string
  requirements: Requirement[]
  acceptanceCriteria: AcceptanceCriterion[]
  specPath: string
  planPath?: string
  tasksPath?: string
  /** Texto completo do spec.md (preservado integralmente). */
  rawSpec: string
  rawPlan?: string
  createdAt?: string
  updatedAt?: string
}

export interface Task {
  id: string
  specId: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dependsOn: string[]
  parallelGroup?: string
  specRefs: string[]
  files: string[]
  acceptance: string[]
  blockedReason?: string
  notes?: string
  tasksPath: string
  /** Metadados YAML não reconhecidos, preservados na escrita. */
  extra: Record<string, unknown>
}

export type IssueSeverity = 'error' | 'warning'

export interface ValidationIssue {
  severity: IssueSeverity
  code: string
  message: string
  file?: string
  line?: number
  ref?: string
}

export interface LoadedFile {
  path?: string
  content: string
  /** Hash do conteúdo lido; usado para detectar alteração externa. */
  hash: string
}

export interface ProjectModel {
  project: Project
  specs: Spec[]
  tasks: Task[]
  constitution?: string
  agentInstructions?: string
  issues: ValidationIssue[]
  files: Record<string, LoadedFile>
  isDemo: boolean
}

