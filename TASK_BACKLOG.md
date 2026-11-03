# Backlog inicial de implementação

Status possíveis: `backlog`, `ready`, `in_progress`, `review`, `done`, `blocked`.
Este backlog controla a implementação do próprio SpecBoard. Ele não deve ser confundido com tarefas de exemplo do produto.

## Fase 0 — Preparação

### SB-001 — Ler e resumir os requisitos
- status: ready
- priority: high
- depends_on: []
- acceptance:
  - Resumo da arquitetura e dos riscos registrado.
  - Nenhuma ambiguidade crítica ignorada.

### SB-002 — Definir árvore de arquivos inicial
- status: backlog
- priority: high
- depends_on: [SB-001]
- acceptance:
  - Pastas de app, domínio, infraestrutura e features definidas.

## Fase 1 — Fundação

### SB-003 — Inicializar Vue 3 e TypeScript
- status: backlog
- priority: high
- depends_on: [SB-002]
- parallel_group: foundation
- acceptance:
  - App executa com Vite.
  - TypeScript strict habilitado.

### SB-004 — Configurar Vuetify, router e tema
- status: backlog
- priority: high
- depends_on: [SB-003]
- parallel_group: foundation
- acceptance:
  - Tema dark aplicado.
  - Rotas principais criadas.

### SB-005 — Criar shell e sidebar
- status: backlog
- priority: high
- depends_on: [SB-004]
- acceptance:
  - Navegação funciona.
  - Layout responde a desktop e tablet.

### SB-006 — Criar dashboard demo
- status: backlog
- priority: high
- depends_on: [SB-005]
- acceptance:
  - Métricas e Kanban demo aparecem.
  - Dados estão identificados como fictícios.

## Fase 2 — Modelo documental

### SB-007 — Definir tipos de domínio
- status: backlog
- priority: high
- depends_on: [SB-003]
- parallel_group: domain
- acceptance:
  - Project, Spec, Task e ValidationIssue tipados.

### SB-008 — Implementar parser de frontmatter e tarefas
- status: backlog
- priority: high
- depends_on: [SB-007]
- acceptance:
  - Exemplos são parseados.
  - Erros indicam arquivo e contexto.

### SB-009 — Implementar validação e métricas
- status: backlog
- priority: high
- depends_on: [SB-007]
- acceptance:
  - IDs duplicados, status inválidos e dependências inválidas detectados.
  - Métricas derivadas dos modelos.

### SB-010 — Testar round-trip do Markdown
- status: backlog
- priority: high
- depends_on: [SB-008, SB-009]
- acceptance:
  - Salvar e reler preserva dados e conteúdo desconhecido.

## Fase 3 — Repositório

### SB-011 — Implementar seleção de repositório
- status: backlog
- priority: high
- depends_on: [SB-008]
- acceptance:
  - Usuário seleciona uma raiz autorizada.
  - Paths ficam restritos à raiz.

### SB-012 — Implementar gravação segura e conflito
- status: backlog
- priority: critical
- depends_on: [SB-010, SB-011]
- acceptance:
  - Alteração externa é detectada.
  - Nenhuma sobrescrita silenciosa.

## Fase 4 — Kanban e editores

### SB-013 — Implementar Kanban de Specs
- status: backlog
- priority: high
- depends_on: [SB-006, SB-009]
- acceptance:
  - Colunas e cartões refletem dados parseados.

### SB-014 — Implementar Kanban de tarefas
- status: backlog
- priority: high
- depends_on: [SB-009, SB-012]
- acceptance:
  - Status pode ser alterado e persistido.

### SB-015 — Implementar editor Markdown
- status: backlog
- priority: high
- depends_on: [SB-012]
- acceptance:
  - Preview funciona.
  - Alterações não salvas são sinalizadas.

## Fase 5 — Dependências e contexto

### SB-016 — Visualizar grafo de dependências
- status: backlog
- priority: medium
- depends_on: [SB-009, SB-014]
- acceptance:
  - Ciclos e dependências inexistentes são apresentados.

### SB-017 — Detectar risco de conflito entre tarefas
- status: backlog
- priority: medium
- depends_on: [SB-016]
- acceptance:
  - Tarefas abertas com arquivos sobrepostos são sinalizadas.

### SB-018 — Exportar contexto para agente
- status: backlog
- priority: high
- depends_on: [SB-015]
- acceptance:
  - Contexto inclui Spec, plano, tarefa, dependências e critérios.
  - Copiar para clipboard funciona.
  - Nenhum agente é executado.

### SB-019 — Testar fluxo completo
- status: backlog
- priority: high
- depends_on: [SB-013, SB-014, SB-015, SB-018]
- acceptance:
  - Abrir projeto, editar tarefa, salvar, recarregar e conferir persistência.
  - Lint, testes e build passam.
