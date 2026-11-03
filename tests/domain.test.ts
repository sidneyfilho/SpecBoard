import { describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { buildModel, type FileMap } from '../src/domain/model'
import { appendTaskToSource, nextTaskId, parseTasks, updateTaskInSource } from '../src/domain/parser'
import { analyzeDependencies, parallelCandidates } from '../src/domain/dependencies'
import { computeMetrics } from '../src/domain/metrics'
import { buildAgentContext } from '../src/domain/context'
import { loadProjectFiles } from '../server/repository'
import type { Task, ValidationIssue } from '../src/domain/types'

const EXAMPLES = path.resolve(__dirname, '../examples')

async function exampleModel() {
  const files = await loadProjectFiles(EXAMPLES)
  return buildModel('examples', files)
}

const mk = (id: string, dependsOn: string[] = [], over: Partial<Task> = {}): Task => ({
  id, specId: 'S', title: id, description: '', status: 'backlog', priority: 'medium', dependsOn,
  specRefs: ['REQ-1'], files: [], acceptance: ['ok'], tasksPath: 't.md', extra: {}, ...over,
})

describe('parser e modelo (exemplo)', () => {
  it('lê projeto, spec e tarefas do exemplo', async () => {
    const m = await exampleModel()
    expect(m.project.name).toBe('Alvorland')
    expect(m.specs.map((s) => s.id)).toEqual(['SPEC-001'])
    expect(m.specs[0].requirements).toHaveLength(4)
    expect(m.specs[0].acceptanceCriteria).toHaveLength(4)
    expect(m.tasks.map((t) => t.id)).toEqual(['T001', 'T002', 'T003', 'T004'])
    expect(m.tasks[0].title).toBe('Definir modelo de dados do mapa')
    expect(m.tasks[2].dependsOn).toEqual(['T001', 'T002'])
    expect(m.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(m.constitution).toContain('Godot')
  })

  it('round-trip: alterar status preserva todo o resto', async () => {
    const m = await exampleModel()
    const src = m.files['specs/001-mapa/tasks.md'].content
    const out = updateTaskInSource(src, 'T002', { status: 'in_progress' })
    const diff = src.split(/\r?\n/).filter((l, i) => l !== out.split(/\r?\n/)[i])
    expect(diff).toEqual(['status: backlog'])
    const issues: ValidationIssue[] = []
    const tasks = parseTasks('t.md', out, 'SPEC-001', issues)
    expect(tasks.find((t) => t.id === 'T002')?.status).toBe('in_progress')
    expect(tasks.find((t) => t.id === 'T001')?.status).toBe('ready')
    expect(out.replace(/status: in_progress/, 'status: backlog')).toBe(src.replace(/\r\n/g, '\n').replace(/\n/g, out.includes('\r\n') ? '\r\n' : '\n'))
  })

  it('preserva texto, comentários e chaves YAML desconhecidas', () => {
    const src = `# Tarefas\n\nTexto livre\n\n## T001 — A\n<!-- task:begin -->\nid: T001\nstatus: ready # nota\ncustom_key: valor\nacceptance:\n  - x\n<!-- task:end -->\n\nNotas humanas.\n\n<!-- comentário solto -->\n`
    const out = updateTaskInSource(src, 'T001', { status: 'done' })
    expect(out).toContain('custom_key: valor')
    expect(out).toContain('# nota')
    expect(out).toContain('Texto livre')
    expect(out).toContain('Notas humanas.')
    expect(out).toContain('<!-- comentário solto -->')
    expect(out).toContain('status: done')
    const t = parseTasks('t.md', out, 'S', [])[0]
    expect(t.extra).toEqual({ custom_key: 'valor' })
    expect(t.description).toContain('Notas humanas.')
  })

  it('cria tarefa nova e gera ID único', () => {
    const src = '# Tarefas\n'
    const id = nextTaskId(['T001', 'T009'])
    expect(id).toBe('T010')
    const out = appendTaskToSource(src, { id, title: 'Nova', status: 'backlog', priority: 'low', dependsOn: ['T001'], specRefs: ['REQ-1'], files: ['a.ts'], acceptance: ['feito'] })
    const t = parseTasks('t.md', out, 'S', [])[0]
    expect(t).toMatchObject({ id: 'T010', title: 'Nova', dependsOn: ['T001'], files: ['a.ts'], acceptance: ['feito'] })
  })

  it('reporta status inválido e YAML inválido com arquivo e linha', () => {
    const issues: ValidationIssue[] = []
    const src = '## T1 — x\n<!-- task:begin -->\nid: T1\nstatus: wat\n<!-- task:end -->\n\n## T2 — y\n<!-- task:begin -->\nid: [oops\n<!-- task:end -->\n'
    parseTasks('x/tasks.md', src, 'S', issues)
    expect(issues.map((i) => i.code).sort()).toEqual(['task-status-invalid', 'task-yaml-invalid'])
    expect(issues.every((i) => i.file === 'x/tasks.md' && typeof i.line === 'number')).toBe(true)
  })

  it('detecta IDs duplicados', () => {
    const f = (content: string) => ({ path: '', content, hash: 'h' })
    const files: FileMap = {
      '.specboard/project.yaml': f('id: p\nname: P\n'),
      'specs/a/spec.md': f('---\nid: SPEC-1\nstatus: planning\n---\n# A\n'),
      'specs/a/tasks.md': f('## T1 — x\n<!-- task:begin -->\nid: T1\n<!-- task:end -->\n'),
      'specs/b/spec.md': f('---\nid: SPEC-1\n---\n# B\n'),
      'specs/b/tasks.md': f('## T1 — y\n<!-- task:begin -->\nid: T1\n<!-- task:end -->\n'),
    }
    const codes = buildModel('r', files).issues.map((i) => i.code)
    expect(codes.filter((c) => c === 'id-duplicate')).toHaveLength(2)
  })
})

describe('dependências', () => {
  it('detecta dependência inexistente e ciclo', () => {
    const a = analyzeDependencies([mk('A', ['B']), mk('B', ['C']), mk('C', ['A']), mk('D', ['Z'])])
    expect(a.missing).toEqual([{ task: 'D', dep: 'Z' }])
    expect(a.cycles).toHaveLength(1)
    expect(new Set(a.cycles[0])).toEqual(new Set(['A', 'B', 'C']))
  })
  it('detecta conflito de arquivos entre tarefas abertas', () => {
    const a = analyzeDependencies([mk('A', [], { files: ['x.ts'] }), mk('B', [], { files: ['x.ts'] }), mk('C', [], { files: ['x.ts'], status: 'done' })])
    expect(a.fileConflicts).toEqual([{ files: ['x.ts'], tasks: ['A', 'B'] }])
  })
  it('candidatas a paralelismo respeitam dependências e arquivos', () => {
    const ts = [mk('A', [], { files: ['x'] }), mk('B', ['A']), mk('C', [], { files: ['x'] }), mk('D', [], { files: ['y'] })]
    expect(parallelCandidates(ts).map((t) => t.id)).toEqual(['A', 'D'])
  })
})

describe('métricas', () => {
  it('calcula contagens e fórmulas', async () => {
    const m = await exampleModel()
    const x = computeMetrics(m.specs, m.tasks)
    expect(x.totalTasks).toBe(4)
    expect(x.totalSpecs).toBe(1)
    expect(x.byStatus.ready).toBe(1)
    expect(x.readyForAi).toBe(1)
    expect(x.blockedByDependency).toBe(3)
    expect(x.documentalProgress).toBe(0)
    expect(x.planningCoverage).toBe(1)
  })
  it('não apresenta 100% como final com Specs incompletas', () => {
    const spec = { id: 'S', requirements: [], acceptanceCriteria: [] } as never
    const x = computeMetrics([spec], [mk('A', [], { status: 'done' })])
    expect(x.documentalProgress).toBe(1)
    expect(x.caveat).toBeTruthy()
  })
  it('baseline', () => {
    expect(computeMetrics([], [mk('A'), mk('B')], ['A']).addedAfterBaseline).toBe(1)
  })
})

describe('contexto para agente', () => {
  it('inclui tarefa, spec, plano, regras e dependências', async () => {
    const m = await exampleModel()
    const ctx = buildAgentContext(m, 'T003')
    for (const s of ['T003', 'REQ-002: representar colisões', 'Plano técnico', 'Godot', 'Instruções para agentes', 'T001 — Definir modelo', 'dependências não concluídas'])
      expect(ctx).toContain(s)
  })
})

void fs
