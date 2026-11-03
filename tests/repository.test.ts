import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { RepoError, loadProjectFiles, resolveInside, safeWrite, sha256, validateRoot } from '../server/repository'

let root: string
beforeAll(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'specboard-'))
  await fs.mkdir(path.join(root, '.specboard'))
  await fs.writeFile(path.join(root, '.specboard', 'project.yaml'), 'id: t\nname: T\n')
  await fs.mkdir(path.join(root, 'specs', '001'), { recursive: true })
  await fs.writeFile(path.join(root, 'specs', '001', 'tasks.md'), 'original')
})
afterAll(() => fs.rm(root, { recursive: true, force: true }))

describe('repositório seguro', () => {
  it('bloqueia path traversal e caminhos absolutos', () => {
    for (const bad of ['../x.md', 'specs/../../x.md', '..\\x.md', path.resolve('/etc/passwd'), 'C:\\Windows\\a.md', '.git/config', ''])
      expect(() => resolveInside(root, bad)).toThrow(RepoError)
    expect(resolveInside(root, 'specs/001/tasks.md')).toContain('tasks.md')
  })

  it('valida raiz com project.yaml', async () => {
    await expect(validateRoot(os.tmpdir())).rejects.toThrow(RepoError)
    await expect(validateRoot(root)).resolves.toBe(root)
  })

  it('grava com hash correto e atualiza arquivo', async () => {
    const files = await loadProjectFiles(root)
    const h = files['specs/001/tasks.md'].hash
    const out = await safeWrite(root, 'specs/001/tasks.md', 'novo', h)
    expect(out.hash).toBe(sha256('novo'))
    expect(await fs.readFile(path.join(root, 'specs/001/tasks.md'), 'utf8')).toBe('novo')
    expect((await fs.readdir(path.join(root, 'specs/001'))).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  it('recusa sobrescrever alteração externa (conflito)', async () => {
    const stale = sha256('novo')
    await fs.writeFile(path.join(root, 'specs/001/tasks.md'), 'editado por fora')
    const err = await safeWrite(root, 'specs/001/tasks.md', 'meu', stale).catch((e: RepoError) => e)
    expect(err).toBeInstanceOf(RepoError)
    expect((err as RepoError).status).toBe(409)
    expect((err as RepoError).extra?.currentContent).toBe('editado por fora')
    expect(await fs.readFile(path.join(root, 'specs/001/tasks.md'), 'utf8')).toBe('editado por fora')
  })

  it('cria arquivo novo apenas se não existir e bloqueia extensões', async () => {
    await safeWrite(root, 'specs/002/spec.md', 'x', null)
    await expect(safeWrite(root, 'specs/002/spec.md', 'y', null)).rejects.toThrow(RepoError)
    await expect(safeWrite(root, 'specs/run.sh', 'rm -rf', null)).rejects.toThrow(RepoError)
  })
})
