import type { Task } from './types'

export interface GraphNode {
  id: string
  level: number
  row: number
}

/** Posiciona tarefas em camadas (nível = maior caminho de dependências). Tolera ciclos. */
export function layoutGraph(tasks: Task[]): GraphNode[] {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const level = new Map<string, number>()
  const visiting = new Set<string>()
  const calc = (id: string): number => {
    if (level.has(id)) return level.get(id)!
    if (visiting.has(id)) return 0
    visiting.add(id)
    let l = 0
    for (const d of byId.get(id)?.dependsOn ?? []) if (byId.has(d)) l = Math.max(l, calc(d) + 1)
    visiting.delete(id)
    level.set(id, l)
    return l
  }
  const rows = new Map<number, number>()
  return tasks.map((t) => {
    const l = calc(t.id)
    const row = rows.get(l) ?? 0
    rows.set(l, row + 1)
    return { id: t.id, level: l, row }
  })
}
