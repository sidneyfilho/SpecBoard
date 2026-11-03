import type { FileMap } from '@/domain/model'

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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

async function call<T>(route: string, body: Record<string, unknown> = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/specboard${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Servidor local indisponível. Inicie o app com `npm run dev`.', 0)
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new ApiError(String(data.error ?? `Erro ${res.status}`), res.status, data)
  return data as T
}

export interface OpenResult {
  root: string
  files: FileMap
  git: GitInfo
}

export const repositoryApi = {
  info: () => call<{ exampleRoot: string | null; current: string | null }>('/info'),
  pickFolder: () => call<{ path: string | null }>('/pick-folder'),
  open: (root: string, gitRoot?: string) => call<OpenResult>('/open', { root, gitRoot }),
  reload: (gitRoot?: string) => call<OpenResult>('/reload', { gitRoot }),
  check: (paths: string[], gitRoot?: string) => call<{ hashes: Record<string, string | null>; git: GitInfo }>('/check', { paths, gitRoot }),
  getGitInfo: (gitRoot?: string) => call<{ git: GitInfo }>('/git', { gitRoot }),
  write: (path: string, content: string, expectedHash: string | null, force = false) =>
    call<{ file: { content: string; hash: string } }>('/write', { path, content, expectedHash, force }),
}
