# Plano de implementação

## Fase 0 — Preparação
- Inspecionar todos os documentos do pacote.
- Criar plano técnico detalhado e árvore de arquivos.
- Registrar dúvidas/riscos em `IMPLEMENTATION_LOG.md`.
- Não adicionar dependências sem justificativa.

Critério: plano e arquitetura compreendidos antes de alterar muitos arquivos.

## Fase 1 — Fundação
- Inicializar Vue 3 + TypeScript + Vite.
- Configurar Vuetify, router, lint, format e testes.
- Criar design tokens e layout responsivo.
- Criar dados de demonstração tipados.
- Construir shell e navegação conforme referência.

Critério: aplicação executa, build/lint passam e dashboard responsivo aparece com dados demo.

## Fase 2 — Modelo documental
- Definir tipos Project, Spec, Task e ValidationIssue.
- Implementar parser/frontmatter e parser de tarefas.
- Implementar validação de schema.
- Implementar serializador com preservação de conteúdo desconhecido.
- Criar testes de round-trip.

Critério: exemplos são lidos, editados e serializados sem perder conteúdo não modificado.

## Fase 3 — Repositório local
- Implementar adaptador de filesystem restrito ao projeto selecionado.
- Detectar alterações externas.
- Implementar escrita segura e conflitos.
- Implementar leitura de `.specboard/project.yaml`.
- Implementar listagem de Specs.

Critério: abrir projeto de exemplo, ler e gravar arquivo com segurança.

## Fase 4 — Kanban e editores
- Implementar Kanban de Specs.
- Implementar Kanban de tarefas.
- Implementar edição de Spec, plano e tarefa.
- Atualizar status e salvar Markdown.
- Implementar pesquisa e filtros.

Critério: fluxo de criação/edição/mudança de status persiste e sobrevive a reload.

## Fase 5 — Dependências e métricas
- Implementar grafo de dependências.
- Detectar ciclos, referências inexistentes e conflitos de arquivos.
- Calcular métricas.
- Mostrar tarefas prontas, bloqueadas e Specs incompletas.
- Registrar baseline de escopo de forma versionada, se aprovado.

Critério: métricas e bloqueios batem com os fixtures de teste.

## Fase 6 — Exportação e acabamento
- Gerar pacote de contexto Markdown para cada tarefa.
- Implementar copiar para clipboard.
- Melhorar estados vazios, erros e acessibilidade.
- Testes end-to-end.
- Atualizar documentação de instalação e uso.

Critério: demonstrar fluxo completo de abrir projeto, selecionar tarefa, copiar contexto, editar e salvar.

## Regras entre fases
- Não avançar com build quebrado.
- Rodar testes e lint após cada fase.
- Atualizar `IMPLEMENTATION_LOG.md`.
- Atualizar backlog somente quando os critérios de aceite forem atendidos.
- Não implementar execução de agentes neste MVP.
