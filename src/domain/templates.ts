import type { Priority } from './types'

export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'spec'
  )
}

export function nextSpecNumber(ids: string[]): number {
  let max = 0
  for (const id of ids) {
    const m = /^SPEC-(\d+)$/.exec(id)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return max + 1
}

export function specTemplate(id: string, title: string, priority: Priority): string {
  return `---
id: ${id}
title: ${title}
status: backlog
priority: ${priority}
---

# ${title}

## Objetivo
Descreva o objetivo.

## Problema
Qual problema esta Spec resolve?

## Requisitos
- REQ-001: descreva o primeiro requisito.

## Critérios de aceite
- [ ] Critério verificável.

## Fora do escopo
- 
`
}

export function planTemplate(id: string): string {
  return `# Plano técnico — ${id}

## Contexto

## Abordagem proposta
1. 

## Decisões pendentes

## Riscos
`
}

export function tasksTemplate(id: string): string {
  return `# Tarefas — ${id}
`
}
