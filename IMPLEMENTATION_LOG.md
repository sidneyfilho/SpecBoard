# Implementation Log

O agente deve atualizar este arquivo ao concluir cada fase.

## Estado inicial
- [ ] Fase 0 — Preparação
- [ ] Fase 1 — Fundação
- [ ] Fase 2 — Modelo documental
- [ ] Fase 3 — Repositório local
- [ ] Fase 4 — Kanban e editores
- [ ] Fase 5 — Dependências e métricas
- [ ] Fase 6 — Exportação e acabamento

## Registro de fases

Para cada fase, registrar:
- data;
- tarefas concluídas;
- arquivos criados/modificados;
- decisões e desvios;
- comandos de teste/lint/build executados;
- resultados;
- riscos e pendências;
- próxima fase recomendada.

## Fases 0–6 (primeira passada) — 2026-10-27

- **Concluído**: estrutura do projeto, shell/sidebar/tema, dashboard com dados demo, domínio (tipos, parser, serializador que preserva conteúdo, validação, métricas, dependências, contexto para agente), API local restrita (leitura, escrita segura com conflito, git), Kanban de Specs e tarefas (drag-and-drop + menu + Alt+setas), editores (Markdown com preview, tarefa), criação de Spec a partir de templates, grafo de dependências, arquivos/validação, relatórios, conflito/alteração externa.
- **Decisões**: servidor local = plugin do Vite (`server/api.ts`), sem dependências extras; DnD HTML5 nativo + alternativa por teclado/menu; hash SHA-256 para detecção de conflito; edição por regex/`yaml` Document apenas na região do bloco de tarefa; `done`/`in_progress` são status documentais.
- **Comandos**: `npm test` (18 testes OK), `npm run lint` (OK), `npm run typecheck` (OK), `npm run build` (OK); smoke test da API em `tests/smoke.mjs` (open/write/409/traversal/origem estranha).
- **Pendências/riscos**: sem testes E2E (Playwright) nem validação visual automatizada contra a referência; Cronograma e baseline de escopo não implementados; servidor só em `npm run dev`; ajuste fino visual pendente; backlog `TASK_BACKLOG.md` não foi marcado como concluído (requer revisão manual dos critérios).
- **Próximo**: Playwright para o fluxo abrir → editar → salvar → reabrir; revisão visual; baseline de escopo.
