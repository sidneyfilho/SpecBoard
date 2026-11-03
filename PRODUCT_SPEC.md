# Product Spec — SpecBoard

## 1. Visão

SpecBoard é uma aplicação local para planejar projetos de software orientados por agentes de IA. Oferece um Kanban de especificações e tarefas, editor documental, visão de dependências, métricas de escopo e exportação de contexto para agentes externos.

## 2. Problema

Em projetos que usam vários agentes de programação em paralelo, o escopo pode se perder em conversas, tarefas podem ficar ambíguas e é difícil saber:
- quantas tarefas foram identificadas;
- quantas estão prontas para execução;
- o que está bloqueado;
- quais tarefas dependem de outras;
- quais arquivos serão afetados;
- o que foi adicionado depois da linha de base inicial.

## 3. Usuários e uso principal

Usuário individual que desenvolve projetos usando Claude Code, Antigravity, Codex ou ferramentas semelhantes, e quer manter requisitos e tarefas explícitos em arquivos versionados no Git.

## 4. Princípios

- Arquivos versionados são a fonte da verdade.
- A interface é uma camada visual sobre os documentos, não um banco de dados paralelo.
- O status de tarefa é documental e manual no MVP.
- Cada tarefa deve ser compreensível por um agente sem depender de uma conversa antiga.
- Planejamento e execução são métricas distintas.
- Conflitos e alterações externas precisam ser visíveis.
- Funcionalidade antes de automação de agentes.

## 5. Entidades

### Project
- id
- name
- description
- repositoryRoot
- specsDirectory
- constitutionPath (opcional)
- agentInstructionsPath (opcional)

### Spec
- id único, por exemplo SPEC-001
- title
- status
- priority
- description/objective
- requirements
- acceptanceCriteria
- paths para spec.md, plan.md e tasks.md
- createdAt e updatedAt opcionais

### Task
- id único, por exemplo T001 ou SPEC-001-T001
- title
- description
- status: backlog, ready, in_progress, review, done, blocked
- priority: low, medium, high, critical
- depends_on: lista de IDs
- parallel_group: string opcional
- spec_refs: lista de requisitos
- files: lista de caminhos relativos previstos
- acceptance: lista de critérios
- notes: conteúdo adicional opcional

## 6. Funcionalidades do MVP

### F-01: Seleção de projeto
O usuário seleciona um repositório local autorizado. A aplicação valida se o diretório e os arquivos de configuração são acessíveis.

### F-02: Dashboard
Exibir:
- total de Specs;
- total de tarefas identificadas;
- tarefas prontas para IA;
- tarefas concluídas;
- tarefas bloqueadas;
- Specs incompletas;
- cobertura do planejamento;
- progresso documental;
- mudanças de escopo, quando houver linha de base.

Todos os números são calculados dinamicamente a partir dos documentos.

### F-03: Kanban de Specs
Colunas configuráveis para o estado de planejamento das Specs. Cartões mostram ID, título, prioridade, total de tarefas, prontidão e progresso.

### F-04: Kanban de tarefas
Colunas de status configuráveis. Cartões mostram ID, título, prioridade, Spec, dependências, quantidade de critérios e arquivos envolvidos.

### F-05: Editor de especificações
Editar Markdown com pré-visualização. Preservar conteúdo desconhecido e avisar sobre alterações não salvas.

### F-06: Editor de tarefas
Criar e editar campos estruturados de tarefa. Gerar IDs únicos e atualizar os arquivos com validação.

### F-07: Dependências
Visualizar dependências, dependências não resolvidas, ciclos e tarefas prontas para trabalho paralelo.

### F-08: Métricas
Separar:
- total de tarefas identificadas;
- tarefas suficientemente especificadas/prontas;
- tarefas marcadas como concluídas;
- tarefas bloqueadas;
- tarefas sem critérios de aceite;
- Specs incompletas;
- tarefas adicionadas depois da linha de base.

Não afirmar que o total identificado equivale ao escopo futuro completo: o escopo pode crescer.

### F-09: Exportar contexto para agente
Gerar um Markdown copiável contendo a tarefa, Spec, plano, regras globais, dependências e critérios de aceite. Não executar o agente.

### F-10: Git e alterações externas
Mostrar branch, estado de sincronização quando disponível e alterações locais. Detectar arquivos modificados fora do app. Mostrar diff antes de gravar quando houver conflito.

### F-11: Templates
Permitir criar Specs e tarefas usando templates de Markdown/YAML.

### F-12: Pesquisa e filtros
Pesquisar por ID, título, conteúdo, arquivo, status, prioridade e dependência.

## 7. Regras de domínio

- IDs de Specs e tarefas devem ser únicos no projeto.
- Toda dependência deve apontar para uma tarefa existente.
- Não pode haver ciclos no grafo de dependências.
- Uma tarefa não está pronta se faltar descrição, critérios de aceite ou contexto mínimo definido pelo schema.
- `blocked` deve exibir a razão do bloqueio.
- `done` é um estado documental e não comprova execução de código ou testes.
- Uma tarefa com dependência não concluída pode ser sinalizada como bloqueada por dependência, sem reescrever automaticamente o status original.
- Progresso de execução não é o mesmo que cobertura do planejamento.
- Não contar tarefas inválidas silenciosamente: exibir erro e indicar o arquivo/linha quando possível.
- A escrita deve preservar conteúdo desconhecido e comentários sempre que possível.
- Conflitos externos nunca devem ser sobrescritos sem confirmação explícita.

## 8. Critérios de aceite do MVP

- Abrir um projeto de exemplo e listar suas Specs.
- Ler e interpretar os arquivos de exemplo.
- Exibir tarefas no Kanban a partir de Markdown.
- Criar e editar uma tarefa e persistir em Markdown.
- Reabrir o projeto e manter os mesmos dados.
- Mover uma tarefa entre estados e gravar a mudança no arquivo.
- Calcular métricas de forma consistente.
- Detectar dependência inexistente e ciclo.
- Gerar contexto exportável para um agente.
- Detectar alteração externa e evitar sobrescrita silenciosa.
- Build, lint e testes passam.
- O projeto não executa agentes nem comandos arbitrários.

## 9. Fora de escopo

- Executar agentes.
- Gerenciar terminais de Claude Code ou Antigravity.
- Sincronizar com Jira/Trello/GitHub Issues.
- Multiusuário e colaboração em tempo real.
- Banco remoto.
- Estimativa automática confiável de custo/duração.
- Sistema de permissões multiusuário.
