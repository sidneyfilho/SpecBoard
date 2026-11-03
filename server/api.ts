import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { Plugin } from 'vite'
import { RepoError, gitInfo, hashesOf, loadProjectFiles, pickFolderNative, safeWrite, validateRoot } from './repository'

const MAX_BODY = 2 * 1024 * 1024

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new RepoError('Requisição grande demais.', 413))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as unknown
        if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error()
        resolve(v as Record<string, unknown>)
      } catch {
        reject(new RepoError('JSON inválido.'))
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * API local mínima. A raiz do repositório é escolhida explicitamente pelo usuário
 * (POST /open) e todas as demais operações ficam restritas a ela. Não existe endpoint
 * de execução de comandos; a única chamada externa é `git` com argumentos fixos.
 */
export function specboardApi(): Plugin {
  let root: string | null = null
  return {
    name: 'specboard-api',
    configureServer(server) {
      server.middlewares.use('/api/specboard', (req, res) => {
        void (async () => {
          try {
            // Bloqueia requisições de outras origens (CSRF/DNS rebinding básico).
            const origin = req.headers.origin
            const host = req.headers.host ?? ''
            if (origin && new URL(origin).host !== host) throw new RepoError('Origem não permitida.', 403)
            const url = (req.url ?? '/').split('?')[0]
            if (req.method !== 'POST') throw new RepoError('Método não permitido.', 405)
            const body = await readJson(req)
            if (url === '/info') {
              const example = path.resolve(process.cwd(), 'examples')
              const ok = await validateRoot(example).then(() => true, () => false)
              send(res, 200, { exampleRoot: ok ? example : null, current: root })
              return
            }
            if (url === '/pick-folder') {
              const selected = await pickFolderNative()
              send(res, 200, { path: selected })
              return
            }
            if (url === '/git') {
              const gitTarget = body.gitRoot ? String(body.gitRoot) : root
              if (!gitTarget) throw new RepoError('Nenhum repositório ou pasta Git informada.', 400)
              send(res, 200, { git: await gitInfo(gitTarget) })
              return
            }
            if (url === '/open') {
              const next = await validateRoot(String(body.root ?? ''))
              root = next
              const gitTarget = body.gitRoot ? String(body.gitRoot) : root
              send(res, 200, { root, files: await loadProjectFiles(root), git: await gitInfo(gitTarget) })
              return
            }
            if (!root) throw new RepoError('Nenhum repositório selecionado.', 400)
            if (url === '/reload') {
              const gitTarget = body.gitRoot ? String(body.gitRoot) : root
              send(res, 200, { root, files: await loadProjectFiles(root), git: await gitInfo(gitTarget) })
            } else if (url === '/check') {
              const paths = Array.isArray(body.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : []
              const gitTarget = body.gitRoot ? String(body.gitRoot) : root
              send(res, 200, { hashes: await hashesOf(root, paths), git: await gitInfo(gitTarget) })
            } else if (url === '/write') {
              const expected = body.expectedHash === null ? null : String(body.expectedHash)
              const entry = await safeWrite(root, String(body.path ?? ''), String(body.content ?? ''), expected, body.force === true)
              send(res, 200, { file: entry })
            } else throw new RepoError('Rota desconhecida.', 404)
          } catch (e) {
            if (e instanceof RepoError) send(res, e.status, { error: e.message, ...e.extra })
            else send(res, 500, { error: 'Erro interno.' })
          }
        })()
      })
    },
  }
}
