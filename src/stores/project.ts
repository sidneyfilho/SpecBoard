import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { buildModel, type FileMap } from '@/domain/model'
import { computeMetrics } from '@/domain/metrics'
import { analyzeDependencies, parallelCandidates } from '@/domain/dependencies'
import { appendTaskToSource, nextTaskId, updateFrontmatterKey, updateTaskInSource, type TaskPatch } from '@/domain/parser'
import { nextSpecNumber, planTemplate, slugify, specTemplate, tasksTemplate } from '@/domain/templates'
import type { Priority, ProjectModel, SpecStatus, TaskStatus } from '@/domain/types'
import { ApiError, repositoryApi, type GitInfo } from '@/infrastructure/api-client'
import { buildDemoModel } from '@/infrastructure/demo'

const LAST_ROOT_KEY = 'specboard.lastRoot'
const RECENT_PROJECTS_KEY = 'specboard.recentProjects'
const PROJECT_GIT_ROOTS_KEY = 'specboard.projectGitRoots'

export interface RecentProject {
  id: string
  name: string
  description?: string
  root: string
  lastOpened: number
}

export interface Conflict {
  path: string
  mine: string
  theirs: string | null
  theirsHash: string | null
  /** Reaplica a operação sobre o conteúdo atual do disco, se possível. */
  retryOnTheirs?: (current: string) => string
}

export interface NewTaskInput {
  specId: string
  title: string
  priority: Priority
  status: TaskStatus
  dependsOn: string[]
  specRefs: string[]
  files: string[]
  acceptance: string[]
  parallelGroup?: string
  description?: string
}

/**
 * O modelo é apenas um cache em memória, reconstruído a partir dos arquivos
 * (fonte da verdade). Nada é persistido em localStorage ou banco.
 */
export const useProjectStore = defineStore('project', () => {
  const model = shallowRef<ProjectModel>(buildDemoModel())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const git = ref<GitInfo>({ available: false })
  const conflict = ref<Conflict | null>(null)
  const externalChanges = ref<string[]>([])
  const notice = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const recentProjects = ref<RecentProject[]>([])
  try {
    const saved = localStorage.getItem(RECENT_PROJECTS_KEY)
    if (saved) recentProjects.value = JSON.parse(saved)
  } catch {
    recentProjects.value = []
  }

  const customGitRoots = ref<Record<string, string>>({})
  try {
    const savedRoots = localStorage.getItem(PROJECT_GIT_ROOTS_KEY)
    if (savedRoots) customGitRoots.value = JSON.parse(savedRoots)
  } catch {
    customGitRoots.value = {}
  }

  const currentGitRoot = computed(() => {
    const id = model.value.project.id
    const root = model.value.project.repositoryRoot
    return customGitRoots.value[id] || customGitRoots.value[root] || root
  })

  function saveRecentProject(root: string, id: string, name: string, description?: string) {
    const filtered = recentProjects.value.filter((p) => p.root !== root)
    recentProjects.value = [
      { id, name, description, root, lastOpened: Date.now() },
      ...filtered,
    ].slice(0, 15)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recentProjects.value))
  }

  function removeRecentProject(root: string) {
    recentProjects.value = recentProjects.value.filter((p) => p.root !== root)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recentProjects.value))
  }

  const isDemo = computed(() => model.value.isDemo)
  const metrics = computed(() => computeMetrics(model.value.specs, model.value.tasks))
  const analysis = computed(() => analyzeDependencies(model.value.tasks))
  const parallel = computed(() => parallelCandidates(model.value.tasks))
  const taskById = computed(() => new Map(model.value.tasks.map((t) => [t.id, t])))

  function say(text: string, type: 'success' | 'error' | 'info' = 'success') {
    notice.value = { text, type }
  }

  function applyFiles(files: FileMap, root: string, isDemoModel = false) {
    model.value = buildModel(root, files, isDemoModel)
    externalChanges.value = []
  }

  async function open(root: string, customGitRoot?: string) {
    loading.value = true
    error.value = null
    try {
      const initialGitRoot = customGitRoot ?? customGitRoots.value[root]
      const r = await repositoryApi.open(root, initialGitRoot)
      applyFiles(r.files, r.root)
      const effectiveGitRoot = customGitRoots.value[model.value.project.id] || customGitRoots.value[r.root]
      if (effectiveGitRoot && effectiveGitRoot !== r.git.gitRoot) {
        try {
          const res = await repositoryApi.getGitInfo(effectiveGitRoot)
          r.git = res.git
        } catch {
          // Mantém git original em caso de erro na pasta configurada
        }
      }
      git.value = r.git
      // Guarda apenas o caminho (preferência de UI); as tarefas continuam vindo dos arquivos.
      localStorage.setItem(LAST_ROOT_KEY, r.root)
      saveRecentProject(r.root, model.value.project.id, model.value.project.name, model.value.project.description)
      say(`Projeto "${model.value.project.name}" aberto.`, 'info')
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      loading.value = false
    }
  }

  /** Reabre o último repositório usado (chamado no início do app). */
  async function restore() {
    const last = localStorage.getItem(LAST_ROOT_KEY)
    if (!last) return
    const ok = await open(last)
    if (!ok) {
      localStorage.removeItem(LAST_ROOT_KEY)
      error.value = `Não foi possível reabrir "${last}": ${error.value ?? 'erro desconhecido'}`
    } else notice.value = null
  }

  async function reload() {
    if (isDemo.value) return
    loading.value = true
    try {
      const r = await repositoryApi.reload(currentGitRoot.value)
      applyFiles(r.files, r.root)
      git.value = r.git
      conflict.value = null
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function loadDemo() {
    localStorage.removeItem(LAST_ROOT_KEY)
    model.value = buildDemoModel()
    git.value = { available: false }
    externalChanges.value = []
    error.value = null
  }

  /** Detecta arquivos alterados fora do app comparando hashes. */
  async function checkExternal() {
    if (isDemo.value || conflict.value) return
    const files = model.value.files
    try {
      const r = await repositoryApi.check(Object.keys(files), currentGitRoot.value)
      git.value = r.git
      externalChanges.value = Object.entries(r.hashes)
        .filter(([p, h]) => h !== files[p]?.hash)
        .map(([p]) => p)
    } catch {
      /* servidor indisponível: sem verificação */
    }
  }

  async function refreshGit(targetPath?: string) {
    if (isDemo.value) return git.value
    const gitPath = targetPath ?? currentGitRoot.value
    try {
      const res = await repositoryApi.getGitInfo(gitPath)
      git.value = res.git
      return res.git
    } catch (e) {
      git.value = { available: false, reason: (e as Error).message }
      return git.value
    }
  }

  async function setProjectGitRoot(path: string | null) {
    const id = model.value.project.id
    const root = model.value.project.repositoryRoot
    const updated = { ...customGitRoots.value }
    const trimmed = path?.trim() || ''

    if (!trimmed || trimmed === root) {
      delete updated[id]
      delete updated[root]
    } else {
      updated[id] = trimmed
      if (root) updated[root] = trimmed
    }
    customGitRoots.value = updated
    localStorage.setItem(PROJECT_GIT_ROOTS_KEY, JSON.stringify(updated))
    return refreshGit()
  }

  /** Grava um documento com verificação de conflito. Retorna true se gravou. */
  async function writeDoc(path: string, build: (current: string) => string, force = false): Promise<boolean> {
    if (isDemo.value) {
      say('Dados de demonstração são somente leitura. Abra um repositório para editar.', 'info')
      return false
    }
    const current = model.value.files[path]
    let content: string
    try {
      content = build(current.content)
    } catch (e) {
      say((e as Error).message, 'error')
      return false
    }
    try {
      const r = await repositoryApi.write(path, content, current.hash, force)
      applyFiles({ ...model.value.files, [path]: { path, ...r.file } }, model.value.project.repositoryRoot)
      say('Alterações salvas.')
      void checkExternal()
      return true
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        conflict.value = {
          path,
          mine: content,
          theirs: (e.data.currentContent as string | null) ?? null,
          theirsHash: (e.data.currentHash as string | null) ?? null,
          retryOnTheirs: build,
        }
      } else say((e as Error).message, 'error')
      return false
    }
  }

  /** Conflito: sobrescrever com confirmação explícita do usuário. */
  async function resolveOverwrite() {
    const c = conflict.value
    if (!c) return
    if (c.theirsHash && model.value.files[c.path]) {
      model.value = { ...model.value, files: { ...model.value.files, [c.path]: { path: c.path, content: c.theirs ?? '', hash: c.theirsHash } } }
    }
    const mine = c.mine
    conflict.value = null
    await writeDoc(c.path, () => mine)
  }

  /** Conflito: reaplicar apenas a alteração sobre a versão atual do disco. */
  async function resolveReapply() {
    const c = conflict.value
    if (!c || c.theirs === null || !c.theirsHash || !c.retryOnTheirs) return
    model.value = { ...model.value, files: { ...model.value.files, [c.path]: { path: c.path, content: c.theirs, hash: c.theirsHash } } }
    const build = c.retryOnTheirs
    conflict.value = null
    await writeDoc(c.path, build)
  }

  async function resolveDiscard() {
    conflict.value = null
    await reload()
  }

  async function setTaskStatus(taskId: string, status: TaskStatus, blockedReason?: string) {
    const t = taskById.value.get(taskId)
    if (!t || t.status === status && !blockedReason) return false
    const patch: TaskPatch = { status }
    if (status === 'blocked' && blockedReason) patch.blockedReason = blockedReason
    return writeDoc(t.tasksPath, (src) => updateTaskInSource(src, taskId, patch))
  }

  async function saveTask(taskId: string, patch: TaskPatch) {
    const t = taskById.value.get(taskId)
    if (!t) return false
    return writeDoc(t.tasksPath, (src) => updateTaskInSource(src, taskId, patch))
  }

  async function createTask(input: NewTaskInput) {
    const spec = model.value.specs.find((s) => s.id === input.specId)
    if (!spec?.tasksPath) {
      say('A Spec selecionada não possui tasks.md.', 'error')
      return null
    }
    const id = nextTaskId(model.value.tasks.map((t) => t.id))
    const ok = await writeDoc(spec.tasksPath, (src) => appendTaskToSource(src, { ...input, id }))
    return ok ? id : null
  }

  async function setSpecStatus(specId: string, status: SpecStatus) {
    const s = model.value.specs.find((x) => x.id === specId)
    if (!s || s.status === status) return false
    return writeDoc(s.specPath, (src) => updateFrontmatterKey(src, 'status', status))
  }

  async function saveDocument(path: string, content: string) {
    return writeDoc(path, () => content)
  }

  /** Cria uma Spec nova (spec.md, plan.md, tasks.md) a partir dos templates. Nunca sobrescreve arquivos existentes. */
  async function createSpec(title: string, priority: Priority): Promise<string | null> {
    if (isDemo.value) {
      say('Dados de demonstração são somente leitura. Abra um repositório para editar.', 'info')
      return null
    }
    const n = nextSpecNumber(model.value.specs.map((s) => s.id))
    const id = `SPEC-${String(n).padStart(3, '0')}`
    const dir = `${model.value.project.specsDirectory}/${String(n).padStart(3, '0')}-${slugify(title)}`
    try {
      await repositoryApi.write(`${dir}/spec.md`, specTemplate(id, title, priority), null)
      await repositoryApi.write(`${dir}/plan.md`, planTemplate(id), null)
      await repositoryApi.write(`${dir}/tasks.md`, tasksTemplate(id), null)
      await reload()
      say(`${id} criada.`)
      return id
    } catch (e) {
      say((e as Error).message, 'error')
      return null
    }
  }

  return {
    model, loading, error, git, conflict, externalChanges, notice, isDemo, metrics, analysis, parallel, taskById,
    recentProjects, removeRecentProject, customGitRoots, currentGitRoot, setProjectGitRoot, refreshGit,
    open, restore, reload, loadDemo, checkExternal, writeDoc, resolveOverwrite, resolveReapply, resolveDiscard,
    setTaskStatus, saveTask, createTask, setSpecStatus, saveDocument, createSpec, say,
  }
})
