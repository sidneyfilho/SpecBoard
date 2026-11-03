import type { Task, ValidationIssue } from './types'

export interface DependencyAnalysis {
  /** tarefa -> dependências inexistentes */
  missing: { task: string; dep: string }[]
  cycles: string[][]
  /** Tarefas abertas que compartilham arquivos previstos. */
  fileConflicts: { files: string[]; tasks: string[] }[]
}

export function isOpen(t: Task): boolean {
  return t.status !== 'done'
}

export function analyzeDependencies(tasks: Task[]): DependencyAnalysis {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const missing: DependencyAnalysis['missing'] = []
  for (const t of tasks) for (const d of t.dependsOn) if (!byId.has(d)) missing.push({ task: t.id, dep: d })

  // detecção de ciclos (DFS com cores)
  const color = new Map<string, 0 | 1 | 2>()
  const cycles: string[][] = []
  const stack: string[] = []
  const seen = new Set<string>()
  const visit = (id: string) => {
    color.set(id, 1)
    stack.push(id)
    for (const d of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(d)) continue
      const c = color.get(d) ?? 0
      if (c === 0) visit(d)
      else if (c === 1) {
        const cyc = stack.slice(stack.indexOf(d))
        const key = [...cyc].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          cycles.push([...cyc, d])
        }
      }
    }
    stack.pop()
    color.set(id, 2)
  }
  for (const t of tasks) if ((color.get(t.id) ?? 0) === 0) visit(t.id)

  const fileConflicts: DependencyAnalysis['fileConflicts'] = []
  const byFile = new Map<string, string[]>()
  for (const t of tasks.filter(isOpen)) for (const f of t.files) byFile.set(f, [...(byFile.get(f) ?? []), t.id])
  const grouped = new Map<string, string[]>()
  for (const [f, ids] of byFile) {
    if (ids.length < 2) continue
    const k = ids.join('|')
    grouped.set(k, [...(grouped.get(k) ?? []), f])
  }
  for (const [k, files] of grouped) fileConflicts.push({ files, tasks: k.split('|') })
  return { missing, cycles, fileConflicts }
}

/** Dependências não concluídas (ou inexistentes) de uma tarefa. */
export function unresolvedDeps(task: Task, byId: Map<string, Task>): string[] {
  return task.dependsOn.filter((d) => byId.get(d)?.status !== 'done')
}

export function isBlockedByDependency(task: Task, byId: Map<string, Task>): boolean {
  return task.status !== 'done' && unresolvedDeps(task, byId).length > 0
}

/** Prontas para trabalho paralelo: abertas em backlog/ready, dependências satisfeitas, sem conflito de arquivos entre si. */
export function parallelCandidates(tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const candidates = tasks.filter(
    (t) => (t.status === 'ready' || t.status === 'backlog') && !isBlockedByDependency(t, byId) && isSpecified(t),
  )
  const inUse = new Set(tasks.filter((t) => t.status === 'in_progress' || t.status === 'review').flatMap((t) => t.files))
  const taken = new Set<string>(inUse)
  const out: Task[] = []
  for (const t of candidates) {
    if (t.files.some((f) => taken.has(f))) continue
    t.files.forEach((f) => taken.add(f))
    out.push(t)
  }
  return out
}

/** Critério de "suficientemente especificada": critérios de aceite e ao menos uma referência de requisito ou arquivo previsto. */
export function isSpecified(t: Task): boolean {
  return t.acceptance.length > 0 && (t.specRefs.length > 0 || t.files.length > 0)
}

export function dependencyIssues(tasks: Task[]): ValidationIssue[] {
  const a = analyzeDependencies(tasks)
  const issues: ValidationIssue[] = []
  const file = (id: string) => tasks.find((t) => t.id === id)?.tasksPath
  for (const m of a.missing)
    issues.push({ severity: 'error', code: 'dep-missing', message: `${m.task} depende de ${m.dep}, que não existe.`, file: file(m.task), ref: m.task })
  for (const c of a.cycles)
    issues.push({ severity: 'error', code: 'dep-cycle', message: `Ciclo de dependências: ${c.join(' → ')}.`, file: file(c[0]), ref: c[0] })
  for (const f of a.fileConflicts)
    issues.push({ severity: 'warning', code: 'file-conflict', message: `Tarefas ${f.tasks.join(', ')} alteram os mesmos arquivos: ${f.files.join(', ')}.`, ref: f.tasks[0] })
  return issues
}
