import { createHash, randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { parse as parseYaml } from 'yaml'

export const ALLOWED_EXT = new Set(['.md', '.yaml', '.yml'])
const MAX_BYTES = 1024 * 1024
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

export class RepoError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export interface FileEntry {
  content: string
  hash: string
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Resolve um caminho relativo garantindo que permaneça dentro da raiz autorizada. */
export async function pickFolderNative(): Promise<string | null> {
  if (process.platform !== 'win32') {
    return null
  }
  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Selecione a pasta do projeto SpecBoard'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
`
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-STA', '-Command', psScript],
      { timeout: 60000, windowsHide: false },
      (err, stdout) => {
        if (err || !stdout) resolve(null)
        else {
          const selected = stdout.trim()
          resolve(selected || null)
        }
      },
    )
  })
}

export function resolveInside(root: string, rel: string): string {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) throw new RepoError('Caminho inválido.')
  if (path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) throw new RepoError('Caminho absoluto não permitido.', 403)
  const abs = path.resolve(root, rel)
  const relative = path.relative(root, abs)
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new RepoError('Caminho fora do repositório autorizado.', 403)
  }
  const parts = relative.split(path.sep)
  if (parts.includes('.git') || parts.includes('node_modules')) throw new RepoError('Caminho não permitido.', 403)
  return abs
}

const toPosix = (p: string) => p.split(path.sep).join('/')

export async function validateRoot(input: string): Promise<string> {
  if (typeof input !== 'string' || !input.trim()) throw new RepoError('Informe o caminho do repositório.')
  const root = path.resolve(input.trim())
  let st
  try {
    st = await fs.stat(root)
  } catch {
    throw new RepoError('Diretório não encontrado ou inacessível.', 404)
  }
  if (!st.isDirectory()) throw new RepoError('O caminho não é um diretório.')
  try {
    await fs.access(path.join(root, '.specboard', 'project.yaml'))
  } catch {
    throw new RepoError('Arquivo .specboard/project.yaml não encontrado neste diretório.', 404)
  }
  return root
}

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue
    const abs = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) await walk(abs, root, out)
    } else if (ALLOWED_EXT.has(path.extname(e.name).toLowerCase())) out.push(toPosix(path.relative(root, abs)))
  }
}

async function readEntry(root: string, rel: string): Promise<FileEntry | null> {
  const abs = resolveInside(root, rel)
  try {
    const st = await fs.stat(abs)
    if (!st.isFile() || st.size > MAX_BYTES) return null
    const content = await fs.readFile(abs, 'utf8')
    return { content, hash: sha256(content) }
  } catch {
    return null
  }
}

/** Lê todos os documentos relevantes do projeto (.specboard, specs, AGENTS.md e caminhos configurados). */
export async function loadProjectFiles(root: string): Promise<Record<string, FileEntry>> {
  const files: Record<string, FileEntry> = {}
  const cfg = await readEntry(root, '.specboard/project.yaml')
  if (!cfg) throw new RepoError('Não foi possível ler .specboard/project.yaml.', 404)
  files['.specboard/project.yaml'] = cfg
  let conf: Record<string, unknown> = {}
  try {
    const p = parseYaml(cfg.content) as unknown
    if (p && typeof p === 'object') conf = p as Record<string, unknown>
  } catch {
    /* erros de YAML são reportados pelo domínio */
  }
  const specsDir = typeof conf.specs_directory === 'string' ? conf.specs_directory : 'specs'
  const rels: string[] = []
  await walk(path.join(root, '.specboard'), root, rels)
  try {
    await walk(resolveInside(root, specsDir), root, rels)
  } catch {
    /* specs_directory inválido: sem specs */
  }
  for (const key of ['constitution_path', 'agent_instructions_path']) {
    const v = conf[key]
    if (typeof v === 'string') rels.push(v)
  }
  rels.push('AGENTS.md')
  for (const rel of new Set(rels)) {
    try {
      const entry = await readEntry(root, rel)
      if (entry) files[rel] = entry
    } catch {
      /* caminho não permitido: ignorado */
    }
  }
  return files
}

export async function hashesOf(root: string, paths: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  for (const p of paths) {
    try {
      out[p] = (await readEntry(root, p))?.hash ?? null
    } catch {
      out[p] = null
    }
  }
  return out
}

/**
 * Escrita segura: valida extensão, confere o hash esperado (conflito => 409),
 * escreve em arquivo temporário no mesmo diretório e renomeia.
 * `expectedHash === null` significa "arquivo novo; não deve existir".
 * `force` só deve ser usado após confirmação explícita do usuário.
 */
export async function safeWrite(
  root: string,
  rel: string,
  content: string,
  expectedHash: string | null,
  force = false,
): Promise<FileEntry> {
  const abs = resolveInside(root, rel)
  if (!ALLOWED_EXT.has(path.extname(abs).toLowerCase())) throw new RepoError('Extensão de arquivo não permitida.', 403)
  if (typeof content !== 'string' || Buffer.byteLength(content) > MAX_BYTES) throw new RepoError('Conteúdo inválido ou grande demais.', 413)
  const current = await readEntry(root, rel)
  if (!force) {
    if (expectedHash === null && current) {
      throw new RepoError('O arquivo já existe.', 409, { conflict: true, currentContent: current.content, currentHash: current.hash })
    }
    if (expectedHash !== null && (!current || current.hash !== expectedHash)) {
      throw new RepoError('O arquivo foi alterado externamente desde a leitura.', 409, {
        conflict: true,
        currentContent: current?.content ?? null,
        currentHash: current?.hash ?? null,
      })
    }
  }
  await fs.mkdir(path.dirname(abs), { recursive: true })
  const tmp = `${abs}.${randomBytes(6).toString('hex')}.tmp`
  try {
    await fs.writeFile(tmp, content, 'utf8')
    await fs.rename(tmp, abs)
  } catch (e) {
    await fs.rm(tmp, { force: true })
    throw new RepoError(`Falha ao gravar: ${(e as Error).message}`, 500)
  }
  return { content, hash: sha256(content) }
}

function git(root: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    // Argumentos fixos definidos pelo servidor; nunca derivados de documentos.
    execFile('git', args, { cwd: root, timeout: 10000, maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (err, stdout) =>
      // Remove só o fim: o espaço inicial de " M arquivo" é significativo no --porcelain.
      resolve(err ? null : stdout.replace(/\s+$/, '')),
    )
  })
}

export interface GitInfo {
  available: boolean
  branch?: string
  dirty?: boolean
  changed?: string[]
  ahead?: number
  behind?: number
  reason?: string
  gitRoot?: string
}

export async function gitInfo(root: string): Promise<GitInfo> {
  if (!root) return { available: false, reason: 'Nenhum caminho especificado.' }
  try {
    const st = await fs.stat(root)
    if (!st.isDirectory()) return { available: false, reason: 'O caminho do Git não é um diretório.' }
  } catch {
    return { available: false, reason: 'Diretório do Git não encontrado ou inacessível.' }
  }

  const branch = await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])
  if (branch === null) {
    if ((await git(root, ['--version'])) === null) return { available: false, reason: 'Executável git não encontrado no PATH do servidor.' }
    const inside = await git(root, ['rev-parse', '--is-inside-work-tree'])
    return inside === 'true'
      ? { available: true, branch: '(sem commits)', changed: [], dirty: false, gitRoot: root }
      : { available: false, reason: 'A pasta não está dentro de um repositório Git.' }
  }
  const status = (await git(root, ['status', '--porcelain', '--', '.'])) ?? ''
  const changed = status.split('\n').filter(Boolean).map((l) => l.slice(3))
  const counts = await git(root, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'])
  let behind: number | undefined
  let ahead: number | undefined
  if (counts) [behind, ahead] = counts.split(/\s+/).map(Number)
  return { available: true, branch, dirty: changed.length > 0, changed, ahead, behind, gitRoot: root }
}
