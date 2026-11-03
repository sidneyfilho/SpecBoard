import type { ProjectModel, Task } from './types'
import { unresolvedDeps } from './dependencies'

/** Gera o pacote de contexto Markdown para um agente externo. Não executa nada. */
export function buildAgentContext(model: ProjectModel, taskId: string): string {
  const task = model.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error(`Tarefa ${taskId} não encontrada.`)
  const spec = model.specs.find((s) => s.id === task.specId)
  const byId = new Map(model.tasks.map((t) => [t.id, t]))
  const list = (a: string[]) => (a.length ? a.map((x) => `- ${x}`).join('\n') : '- (nenhum)')
  const depLine = (id: string) => {
    const d = byId.get(id)
    return d ? `${d.id} — ${d.title} [${d.status}]` : `${id} [INEXISTENTE]`
  }
  const reqs = task.specRefs.map((r) => {
    const req = spec?.requirements.find((x) => x.id === r)
    return req ? `${req.id}: ${req.text}` : r
  })
  const parts: string[] = [
    `# Contexto da tarefa ${task.id} — ${task.title}`,
    `Projeto: ${model.project.name}`,
    `## Tarefa\n- ID: ${task.id}\n- Status: ${task.status}\n- Prioridade: ${task.priority}\n- Spec: ${spec ? `${spec.id} — ${spec.title}` : task.specId}` +
      (task.parallelGroup ? `\n- Grupo paralelo: ${task.parallelGroup}` : ''),
  ]
  if (task.description) parts.push(`### Descrição\n${task.description}`)
  parts.push(`### Critérios de aceite\n${list(task.acceptance)}`)
  parts.push(`### Requisitos referenciados\n${list(reqs)}`)
  parts.push(`### Arquivos previstos\n${list(task.files)}`)
  const pending = unresolvedDeps(task, byId)
  parts.push(`### Dependências\n${list(task.dependsOn.map(depLine))}` + (pending.length ? `\n\nAtenção: dependências não concluídas: ${pending.join(', ')}.` : ''))
  if (task.blockedReason) parts.push(`### Motivo do bloqueio\n${task.blockedReason}`)
  if (task.notes) parts.push(`### Notas\n${task.notes}`)
  if (spec) {
    parts.push(`## Spec ${spec.id}\n${spec.rawSpec.trim()}`)
    if (spec.rawPlan) parts.push(`## Plano técnico\n${spec.rawPlan.trim()}`)
  }
  if (model.constitution) parts.push(`## Regras globais do projeto\n${model.constitution.trim()}`)
  if (model.agentInstructions) parts.push(`## Instruções para agentes\n${model.agentInstructions.trim()}`)
  parts.push('---\nNão amplie o escopo silenciosamente. Se descobrir trabalho adicional, proponha uma nova tarefa. Informe arquivos alterados e testes realizados.')
  return parts.join('\n\n') + '\n'
}

export function taskLabel(t: Task): string {
  return `${t.id} — ${t.title}`
}
