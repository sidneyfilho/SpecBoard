import { parse as parseYaml, parseDocument } from 'yaml'
import {
  SPEC_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type AcceptanceCriterion,
  type Priority,
  type Requirement,
  type Spec,
  type SpecStatus,
  type Task,
  type TaskStatus,
  type ValidationIssue,
} from './types'

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export interface Frontmatter {
  data: Record<string, unknown>
  body: string
}

export function parseFrontmatter(source: string, file: string, issues: ValidationIssue[]): Frontmatter {
  const m = FRONTMATTER_RE.exec(source)
  if (!m) return { data: {}, body: source }
  try {
    const data = parseYaml(m[1]) as unknown
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { data: data as Record<string, unknown>, body: source.slice(m[0].length) }
    }
  } catch (e) {
    issues.push({ severity: 'error', code: 'yaml-invalid', message: `Frontmatter YAML inválido: ${(e as Error).message}`, file, line: 1 })
  }
  return { data: {}, body: source.slice(m[0].length) }
}

function section(body: string, headings: string[]): string {
  const lines = body.split(/\r?\n/)
  const out: string[] = []
  let inside = false
  for (const line of lines) {
    const h = /^##\s+(.*)$/.exec(line)
    if (h) {
      if (inside) break
      inside = headings.some((x) => h[1].trim().toLowerCase() === x)
      continue
    }
    if (inside) out.push(line)
  }
  return out.join('\n').trim()
}

export function parseRequirements(body: string): Requirement[] {
  const text = section(body, ['requisitos', 'requirements'])
  const reqs: Requirement[] = []
  for (const line of text.split('\n')) {
    const m = /^\s*[-*]\s+\**([A-Z]+-\d+)\**\s*[:\-–—]\s*(.+)$/.exec(line)
    if (m) reqs.push({ id: m[1], text: m[2].trim() })
  }
  return reqs
}

export function parseAcceptanceCriteria(body: string): AcceptanceCriterion[] {
  const text = section(body, ['critérios de aceite', 'criterios de aceite', 'acceptance criteria'])
  const out: AcceptanceCriterion[] = []
  for (const line of text.split('\n')) {
    const m = /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.exec(line)
    if (m) out.push({ checked: m[1].toLowerCase() === 'x', text: m[2].trim() })
  }
  return out
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T, issue: (v: string) => void): T {
  if (value === undefined || value === null) return fallback
  const s = String(value)
  if ((allowed as readonly string[]).includes(s)) return s as T
  issue(s)
  return fallback
}

export function parseSpec(
  specPath: string,
  rawSpec: string,
  extra: { planPath?: string; rawPlan?: string; tasksPath?: string },
  issues: ValidationIssue[],
): Spec {
  const { data, body } = parseFrontmatter(rawSpec, specPath, issues)
  const id = typeof data.id === 'string' ? data.id : ''
  if (!id) issues.push({ severity: 'error', code: 'spec-id-missing', message: 'Spec sem `id` no frontmatter.', file: specPath, line: 1 })
  const status = enumValue<SpecStatus>(data.status, SPEC_STATUSES, 'backlog', (v) =>
    issues.push({ severity: 'error', code: 'spec-status-invalid', message: `Status de Spec inválido: "${v}".`, file: specPath, ref: id }),
  )
  const priority = enumValue<Priority>(data.priority, TASK_PRIORITIES, 'medium', (v) =>
    issues.push({ severity: 'error', code: 'priority-invalid', message: `Prioridade inválida: "${v}".`, file: specPath, ref: id }),
  )
  const titleFromBody = /^#\s+(.+)$/m.exec(body)?.[1]
  return {
    id: id || `SPEC-?${specPath}`,
    title: typeof data.title === 'string' ? data.title : (titleFromBody ?? id),
    status,
    priority,
    objective: section(body, ['objetivo', 'objective']),
    requirements: parseRequirements(body),
    acceptanceCriteria: parseAcceptanceCriteria(body),
    specPath,
    planPath: extra.planPath,
    tasksPath: extra.tasksPath,
    rawSpec,
    rawPlan: extra.rawPlan,
    createdAt: data.created_at ? String(data.created_at) : undefined,
    updatedAt: data.updated_at ? String(data.updated_at) : undefined,
  }
}

const BEGIN = '<!-- task:begin -->'
const END = '<!-- task:end -->'

export interface TaskBlockLocation {
  /** Offset do primeiro caractere do YAML (após o marcador begin). */
  yamlStart: number
  /** Offset do marcador end. */
  yamlEnd: number
  /** Linha (1-based) do marcador begin. */
  line: number
}

export function locateTaskBlocks(source: string): TaskBlockLocation[] {
  const out: TaskBlockLocation[] = []
  let from = 0
  for (;;) {
    const b = source.indexOf(BEGIN, from)
    if (b < 0) break
    const e = source.indexOf(END, b)
    if (e < 0) break
    out.push({
      yamlStart: b + BEGIN.length,
      yamlEnd: e,
      line: source.slice(0, b).split('\n').length,
    })
    from = e + END.length
  }
  return out
}

function strList(v: unknown): string[] {
  if (v === undefined || v === null) return []
  if (Array.isArray(v)) return v.map((x) => String(x))
  return [String(v)]
}

const KNOWN_TASK_KEYS = new Set([
  'id', 'title', 'status', 'priority', 'depends_on', 'parallel_group', 'spec_refs', 'files', 'acceptance', 'blocked_reason', 'notes',
])

export function parseTasks(tasksPath: string, source: string, specId: string, issues: ValidationIssue[]): Task[] {
  const tasks: Task[] = []
  for (const loc of locateTaskBlocks(source)) {
    const yamlText = source.slice(loc.yamlStart, loc.yamlEnd)
    let data: Record<string, unknown>
    try {
      const parsed = parseYaml(yamlText) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bloco não é um mapa YAML')
      data = parsed as Record<string, unknown>
    } catch (e) {
      issues.push({ severity: 'error', code: 'task-yaml-invalid', message: `Bloco de tarefa inválido: ${(e as Error).message}`, file: tasksPath, line: loc.line })
      continue
    }
    const id = typeof data.id === 'string' ? data.id : data.id != null ? String(data.id) : ''
    if (!id) {
      issues.push({ severity: 'error', code: 'task-id-missing', message: 'Tarefa sem `id`.', file: tasksPath, line: loc.line })
      continue
    }
    // título do cabeçalho "## T001 — Título" imediatamente antes do bloco
    const before = source.slice(0, source.indexOf(BEGIN, loc.yamlStart - BEGIN.length - 1))
    const headings = before.split('\n').filter((l) => /^##\s+/.test(l))
    const last = headings[headings.length - 1] ?? ''
    const hm = /^##\s+\S+\s*[—–-]\s*(.+)$/.exec(last.trim())
    const title = typeof data.title === 'string' ? data.title : (hm?.[1].trim() ?? id)

    const status = enumValue<TaskStatus>(data.status, TASK_STATUSES, 'backlog', (v) =>
      issues.push({ severity: 'error', code: 'task-status-invalid', message: `Status inválido "${v}" na tarefa ${id}.`, file: tasksPath, line: loc.line, ref: id }),
    )
    const priority = enumValue<Priority>(data.priority, TASK_PRIORITIES, 'medium', (v) =>
      issues.push({ severity: 'error', code: 'priority-invalid', message: `Prioridade inválida "${v}" na tarefa ${id}.`, file: tasksPath, line: loc.line, ref: id }),
    )

    // descrição = texto após o marcador end até o próximo cabeçalho "## "
    const afterStart = loc.yamlEnd + END.length
    const rest = source.slice(afterStart)
    const nextH = rest.search(/^##\s+/m)
    const description = (nextH >= 0 ? rest.slice(0, nextH) : rest).trim()

    const extra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data)) if (!KNOWN_TASK_KEYS.has(k)) extra[k] = v

    tasks.push({
      id,
      specId,
      title,
      description,
      status,
      priority,
      dependsOn: strList(data.depends_on),
      parallelGroup: data.parallel_group ? String(data.parallel_group) : undefined,
      specRefs: strList(data.spec_refs),
      files: strList(data.files),
      acceptance: strList(data.acceptance),
      blockedReason: data.blocked_reason ? String(data.blocked_reason) : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      tasksPath,
      extra,
    })
  }
  return tasks
}

export interface TaskPatch {
  title?: string
  status?: TaskStatus
  priority?: Priority
  dependsOn?: string[]
  parallelGroup?: string | null
  specRefs?: string[]
  files?: string[]
  acceptance?: string[]
  blockedReason?: string | null
  notes?: string | null
}

const PATCH_KEYS: Record<keyof TaskPatch, string> = {
  title: 'title',
  status: 'status',
  priority: 'priority',
  dependsOn: 'depends_on',
  parallelGroup: 'parallel_group',
  specRefs: 'spec_refs',
  files: 'files',
  acceptance: 'acceptance',
  blockedReason: 'blocked_reason',
  notes: 'notes',
}

const SCALAR_FIELDS = new Set<keyof TaskPatch>(['status', 'priority', 'title', 'parallelGroup'])

/**
 * Altera somente a região YAML da tarefa. Markdown fora do bloco e chaves YAML
 * desconhecidas (e seus comentários) permanecem intactos.
 */
export function updateTaskInSource(source: string, taskId: string, patch: TaskPatch): string {
  for (const loc of locateTaskBlocks(source)) {
    const yamlText = source.slice(loc.yamlStart, loc.yamlEnd)
    const doc = parseDocument(yamlText)
    if (doc.errors.length || String(doc.get('id')) !== taskId) continue
    // Escalares simples já existentes são trocados no texto, sem reformatar o resto do YAML.
    let text = yamlText
    const rest: TaskPatch = {}
    for (const [field, value] of Object.entries(patch) as [keyof TaskPatch, TaskPatch[keyof TaskPatch]][]) {
      const key = PATCH_KEYS[field]
      const re = new RegExp(`^(${key}:[ \\t]*)([^\\r\\n#]*?)([ \\t]*(?:#.*)?)$`, 'm')
      const m = re.exec(text)
      const simple = typeof value === 'string' && SCALAR_FIELDS.has(field) && /^[\w.\-/ ]+$/.test(value)
      if (simple && m && m[2] !== '' && !/^[|>[{]/.test(m[2])) {
        text = text.replace(re, (_m, a: string, _v: string, c: string) => a + value + c)
      } else (rest as Record<string, unknown>)[field] = value
    }
    if (Object.keys(rest).length === 0) return source.slice(0, loc.yamlStart) + text + source.slice(loc.yamlEnd)
    const doc2 = parseDocument(text)
    for (const [field, key] of Object.entries(PATCH_KEYS) as [keyof TaskPatch, string][]) {
      if (!(field in rest)) continue
      const value = rest[field]
      if (value === null || value === undefined) doc2.delete(key)
      else doc2.set(key, Array.isArray(value) && value.length === 0 ? doc2.createNode([], { flow: true }) : value)
    }
    let out = doc2.toString({ lineWidth: 0 })
    if (!out.startsWith('\n')) out = '\n' + out
    if (!out.endsWith('\n')) out += '\n'
    return source.slice(0, loc.yamlStart) + out + source.slice(loc.yamlEnd)
  }
  throw new Error(`Tarefa ${taskId} não encontrada no arquivo.`)
}

function yamlFor(t: { id: string; status: TaskStatus; priority: Priority; dependsOn: string[]; parallelGroup?: string; specRefs: string[]; files: string[]; acceptance: string[] }): string {
  const lst = (k: string, a: string[]) => (a.length ? `${k}:\n${a.map((x) => `  - ${x}`).join('\n')}\n` : `${k}: []\n`)
  return (
    `id: ${t.id}\nstatus: ${t.status}\npriority: ${t.priority}\n` +
    `depends_on: [${t.dependsOn.join(', ')}]\n` +
    (t.parallelGroup ? `parallel_group: ${t.parallelGroup}\n` : '') +
    `spec_refs: [${t.specRefs.join(', ')}]\n` +
    lst('files', t.files) +
    lst('acceptance', t.acceptance)
  )
}

export function appendTaskToSource(
  source: string,
  task: { id: string; title: string; status: TaskStatus; priority: Priority; dependsOn: string[]; parallelGroup?: string; specRefs: string[]; files: string[]; acceptance: string[]; description?: string },
): string {
  const base = source.replace(/\s*$/, '\n')
  const desc = task.description ? `\n${task.description}\n` : ''
  return `${base}\n## ${task.id} — ${task.title}\n${BEGIN}\n${yamlFor(task)}${END}\n${desc}`
}

export function nextTaskId(existing: string[]): string {
  let max = 0
  for (const id of existing) {
    const m = /^T(\d+)$/.exec(id)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `T${String(max + 1).padStart(3, '0')}`
}

/** Atualiza (ou insere) uma chave escalar no frontmatter sem tocar no resto do documento. */
export function updateFrontmatterKey(source: string, key: string, value: string): string {
  const m = FRONTMATTER_RE.exec(source)
  if (!m) return `---\n${key}: ${value}\n---\n${source}`
  const fm = m[1]
  const re = new RegExp(`^(${key}:[ \\t]*)([^\\r\\n#]*?)([ \\t]*(?:#.*)?)$`, 'm')
  const next = re.test(fm) ? fm.replace(re, (_m, a: string, _v: string, c: string) => a + value + c) : `${fm}\n${key}: ${value}`
  return source.slice(0, m.index) + m[0].replace(fm, () => next) + source.slice(m.index + m[0].length)
}

/** Remove o frontmatter YAML de um documento Markdown. */
export function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_RE, '')
}
