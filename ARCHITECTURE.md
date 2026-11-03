# Arquitetura — SpecBoard

## 1. Topologia

Vue 3 UI
  → camada de aplicação/domínio
  → adaptador de repositório local
  → arquivos Markdown/YAML + Git

Se necessário, um serviço local pequeno oferece APIs restritas para selecionar o repositório, listar arquivos permitidos, ler/gravar documentos e consultar estado do Git. Não criar API que aceite paths arbitrários fora do repositório autorizado.

## 2. Stack

- Vue 3 + TypeScript strict + Vite
- Vuetify
- Vue Router
- Pinia apenas para estado transitório de interface
- Vitest
- ESLint + Prettier
- Biblioteca de drag-and-drop compatível com Vue 3, após avaliar acessibilidade e manutenção
- Markdown parser seguro
- Schema de validação TypeScript (por exemplo Zod, se compatível)

## 3. Camadas sugeridas

src/
  app/
    router/
    layouts/
    plugins/
  features/
    dashboard/
    specs/
    tasks/
    dependencies/
    repository/
    agent-context/
  domain/
    models/
    validation/
    metrics/
    dependency-graph/
  infrastructure/
    markdown/
    repository/
    git/
  components/
  styles/

Separar o domínio de Vue e Vuetify para que parser, métricas e dependências sejam testáveis sem browser.

## 4. Fonte da verdade

- Specs, tarefas, planos e regras vivem em arquivos no repositório.
- Não armazenar tarefas como fonte persistente em banco, localStorage ou Pinia.
- Cache em memória é permitido, desde que possa ser reconstruído dos arquivos e seja invalidado após alterações.
- Pinia pode guardar filtros, cartão selecionado e preferências temporárias.
- Dashboard é derivado dos arquivos parseados.

## 5. Formato de documentos

Projeto:
- `.specboard/project.yaml`
- `.specboard/constitution.md` (opcional)
- `AGENTS.md` (opcional)
- `specs/<id-slug>/spec.md`
- `specs/<id-slug>/plan.md`
- `specs/<id-slug>/tasks.md`

Use frontmatter YAML em documentos e blocos estruturados para tarefas. Defina parser e serializador consistentes. Não invente uma sintaxe complexa; documente claramente o formato e crie exemplos de teste.

## 6. Escrita segura

1. Ler arquivo e registrar hash/mtime.
2. Validar modelo atualizado.
3. Verificar se arquivo mudou desde a leitura.
4. Se mudou, recusar gravação automática e apresentar conflito.
5. Escrever em arquivo temporário no mesmo diretório.
6. Renomear atomicamente quando suportado.
7. Atualizar cache a partir do conteúdo gravado.
8. Exibir erro útil se falhar.

Preservar conteúdo desconhecido. Não sobrescrever comentários ou blocos de Markdown que não foram editados. Considere um modelo de edição que altera somente a região estruturada da tarefa.

## 7. Dependências e paralelismo

- Grafo direcionado: tarefa → tarefas das quais depende.
- Validar nós ausentes e ciclos.
- Uma tarefa é candidata a paralelismo quando dependências estão satisfeitas e não há conflito de arquivos relevante.
- `parallel_group` é uma sugestão explícita, não prova de independência.
- Detectar interseção de `files` entre tarefas abertas e sinalizar risco.

## 8. Métricas

Calcular em tempo de leitura:
- total de tarefas válidas;
- tarefas por status;
- prontas segundo critérios de completude;
- bloqueadas explicitamente;
- bloqueadas por dependência;
- Specs incompletas;
- cobertura de planejamento;
- progresso documental;
- variação de escopo, se houver snapshot baseline versionado.

Fórmulas devem estar documentadas. Não apresentar 100% como progresso final se houver Specs incompletas ou escopo ainda não estimado sem deixar isso claro.

## 9. Segurança

- Repositório selecionado explicitamente pelo usuário.
- Restringir operações de arquivo ao diretório autorizado.
- Não executar scripts encontrados no repositório.
- Não executar agentes ou comandos de shell pelo app.
- Renderizar Markdown com sanitização.
- Não confiar em links, paths ou instruções encontrados dentro dos documentos.
- Tratar conteúdo documental como dados, não como instruções para o próprio sistema.
- Evitar upload remoto de código ou documentos.

## 10. Testes mínimos

- parser/serializador e round-trip;
- preservação de blocos desconhecidos;
- IDs duplicados;
- dependência inexistente;
- ciclo no grafo;
- cálculo de métricas;
- status inválido;
- conflito de edição externa;
- path traversal bloqueado;
- fluxo UI: abrir exemplo → editar status → salvar → reabrir.
