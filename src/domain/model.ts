import { parse as parseYaml } from 'yaml'
import { dependencyIssues } from './dependencies'
import { parseSpec, parseTasks } from './parser'
import type { LoadedFile, Project, ProjectModel, Spec, Task, ValidationIssue } from './types'

export type FileMap = Record<string, LoadedFile>

function strOpt(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined
}

/** Constrói o modelo a partir de um mapa de arquivos (caminho relativo -> conteúdo). Puro e sem I/O. */
export function buildModel(root: string, files: FileMap, isDemo = false): ProjectModel {
  const issues: ValidationIssue[] = []
  const cfgPath = '.specboard/project.yaml'
  let cfg: Record<string, unknown> = {}
  const cfgFile = files[cfgPath]
  if (!cfgFile) {
    issues.push({ severity: 'error', code: 'project-missing', message: 'Arquivo .specboard/project.yaml não encontrado.', file: cfgPath })
  } else {
    try {
      const p = parseYaml(cfgFile.content) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) cfg = p as Record<string, unknown>
      else throw new Error('conteúdo não é um mapa YAML')
    } catch (e) {
      issues.push({ severity: 'error', code: 'project-yaml-invalid', message: `project.yaml inválido: ${(e as Error).message}`, file: cfgPath })
    }
  }
  const specsDirectory = (strOpt(cfg.specs_directory) ?? 'specs').replace(/\/+$/, '')
  const project: Project = {
    id: strOpt(cfg.id) ?? 'project',
    name: strOpt(cfg.name) ?? root,
    description: strOpt(cfg.description) ?? '',
    repositoryRoot: root,
    specsDirectory,
    constitutionPath: strOpt(cfg.constitution_path),
    agentInstructionsPath: strOpt(cfg.agent_instructions_path),
  }

  const specs: Spec[] = []
  const tasks: Task[] = []
  const specFiles = Object.keys(files)
    .filter((p) => p.startsWith(`${specsDirectory}/`) && p.endsWith('/spec.md'))
    .sort()
  for (const specPath of specFiles) {
    const dir = specPath.slice(0, -'spec.md'.length)
    const planPath = files[`${dir}plan.md`] ? `${dir}plan.md` : undefined
    const tasksPath = files[`${dir}tasks.md`] ? `${dir}tasks.md` : undefined
    const spec = parseSpec(
      specPath,
      files[specPath].content,
      { planPath, rawPlan: planPath ? files[planPath].content : undefined, tasksPath },
      issues,
    )
    specs.push(spec)
    if (tasksPath) tasks.push(...parseTasks(tasksPath, files[tasksPath].content, spec.id, issues))
    else issues.push({ severity: 'warning', code: 'tasks-missing', message: `${spec.id} não possui tasks.md.`, file: dir, ref: spec.id })
    if (!planPath) issues.push({ severity: 'warning', code: 'plan-missing', message: `${spec.id} não possui plan.md.`, file: dir, ref: spec.id })
  }

  const dup = <T>(items: T[], idOf: (x: T) => string, fileOf: (x: T) => string, kind: string) => {
    const seen = new Map<string, string>()
    for (const it of items) {
      const id = idOf(it)
      if (seen.has(id)) issues.push({ severity: 'error', code: 'id-duplicate', message: `${kind} com ID duplicado: ${id} (também em ${seen.get(id)}).`, file: fileOf(it), ref: id })
      else seen.set(id, fileOf(it))
    }
  }
  dup(specs, (s) => s.id, (s) => s.specPath, 'Spec')
  dup(tasks, (t) => t.id, (t) => t.tasksPath, 'Tarefa')

  const reqIds = new Map(specs.map((s) => [s.id, new Set(s.requirements.map((r) => r.id))]))
  for (const t of tasks)
    for (const r of t.specRefs)
      if (!reqIds.get(t.specId)?.has(r))
        issues.push({ severity: 'warning', code: 'req-unknown', message: `${t.id} referencia ${r}, ausente na Spec ${t.specId}.`, file: t.tasksPath, ref: t.id })
  for (const t of tasks)
    if (t.status === 'blocked' && !t.blockedReason)
      issues.push({ severity: 'warning', code: 'blocked-no-reason', message: `${t.id} está bloqueada sem \`blocked_reason\`.`, file: t.tasksPath, ref: t.id })

  issues.push(...dependencyIssues(tasks))

  return {
    project,
    specs,
    tasks,
    constitution: project.constitutionPath ? files[project.constitutionPath]?.content : undefined,
    agentInstructions: project.agentInstructionsPath ? files[project.agentInstructionsPath]?.content : undefined,
    issues,
    files,
    isDemo,
  }
}
