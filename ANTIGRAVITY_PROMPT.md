# Prompt principal — construir o SpecBoard

Você é o engenheiro principal responsável por implementar o SpecBoard, uma aplicação local de planejamento e documentação de desenvolvimento com IA.

## Antes de codificar

1. Leia completamente:
   - `README.md`
   - `PRODUCT_SPEC.md`
   - `ARCHITECTURE.md`
   - `UI_GUIDELINES.md`
   - `IMPLEMENTATION_PLAN.md`
   - `TASK_BACKLOG.md`
   - `AGENTS.md`
2. Inspecione as imagens em `reference/`.
   - `specboard-dark-dashboard-primary.png` é a referência visual principal.
   - `specboard-light-dashboard-secondary.png` é uma referência secundária de hierarquia e conteúdo.
3. Resuma sua compreensão da arquitetura e liste riscos ou ambiguidades relevantes.
4. Não implemente o produto inteiro em uma única etapa. Siga as fases do `IMPLEMENTATION_PLAN.md`.

## Objetivo do produto

Construir uma interface moderna chamada SpecBoard para organizar especificações (Specs) e tarefas técnicas em projetos de software. O usuário planeja visualmente; arquivos Markdown e YAML no repositório Git são a fonte da verdade; agentes externos como Claude Code e Antigravity leem os documentos e executam o trabalho fora do SpecBoard.

O MVP é somente documentação e planejamento. NÃO implemente execução de agentes, terminal embutido ou automação que execute código de agentes.

## Stack obrigatória

- Vue 3
- TypeScript com strict mode
- Vite
- Vuetify
- Vue Router
- Pinia somente para estado transitório de UI, quando necessário
- Vitest para testes unitários
- Playwright para os principais fluxos end-to-end, se viável
- ESLint e Prettier
- Backend local pequeno para operações seguras de filesystem/Git, caso a aplicação web não consiga realizar essas operações diretamente com segurança. Prefira uma solução simples e documentada; não crie microserviços.

Antes de escolher uma biblioteca de drag-and-drop ou backend, verifique compatibilidade com a versão atual do projeto e mantenha a dependência mínima.

## Direção visual

Use como referência a imagem `reference/specboard-dark-dashboard-primary.png`.
Quero uma aplicação premium, moderna, dinâmica e densa, com aparência de ferramenta profissional de desenvolvimento:

- tema escuro por padrão;
- fundo azul-marinho quase preto;
- sidebar fixa com ícones e navegação;
- gradientes discretos azul/violeta;
- estados de status com cores consistentes;
- cartões com bordas sutis, profundidade leve e bom contraste;
- tipografia legível e hierarquia visual forte;
- dashboard com métricas e indicadores de progresso;
- Kanban com colunas, cartões compactos e contadores;
- painel inferior ou lateral de detalhes da tarefa selecionada;
- ícones consistentes; evite emojis como ícones de interface;
- responsividade para desktop e tablet;
- microinterações discretas, sem excesso de animação.

Não copie literalmente os números ou os dados fictícios da imagem. Use dados de demonstração claramente identificados e faça a interface funcionar com dados reais do modelo documental.

## Regras arquiteturais não negociáveis

1. Markdown/YAML no repositório é a fonte da verdade.
2. Não manter uma cópia persistente separada das tarefas em localStorage, banco de dados ou Pinia.
3. Estado de UI temporário pode usar Pinia/ref.
4. Totais, progresso e bloqueios são derivados dos arquivos e das regras de domínio.
5. Preservar texto Markdown desconhecido e metadados não reconhecidos.
6. Não sobrescrever silenciosamente alterações feitas externamente.
7. Operações de escrita devem validar dados e usar escrita segura/atômica sempre que possível.
8. Detectar IDs duplicados, dependências inexistentes, ciclos e status inválidos.
9. Não alegar que uma tarefa está realmente sendo executada por uma IA. O status é documental/manual no MVP.
10. Não executar comandos de agentes nem abrir terminal para eles.
11. Não adicionar autenticação, cloud, colaboração em tempo real ou banco de dados remoto ao MVP.
12. Nunca colocar um endpoint de filesystem que aceite caminhos arbitrários sem validação e restrição ao repositório autorizado.

## Ordem de implementação

Siga `IMPLEMENTATION_PLAN.md` e o backlog em `TASK_BACKLOG.md`.

Fase inicial:
- criar a estrutura do projeto;
- configurar Vuetify, router, lint, testes e tema;
- criar dados de demonstração através do mesmo modelo de domínio usado para os arquivos reais;
- implementar o shell visual e a navegação;
- implementar o parser/serializador e testes antes de habilitar edição de arquivos reais.

Depois avance por etapas, validando cada uma. Ao terminar uma fase:
- execute testes, lint e build;
- corrija falhas antes de seguir;
- atualize `IMPLEMENTATION_LOG.md` com arquivos criados, decisões, comandos executados, resultados e itens pendentes;
- marque tarefas no backlog de implementação apenas quando os critérios de aceite forem atendidos;
- não marque tarefas de produto como concluídas sem que o comportamento esteja implementado e testado.

## Entregáveis

- Aplicação funcional e executável localmente.
- README com instalação e comandos.
- Documentação de arquitetura.
- Templates e exemplos Markdown/YAML.
- Testes para parser, métricas, dependências e gravação segura.
- Interface polida que se aproxime da referência visual.
- Um fluxo completo demonstrável: abrir projeto de exemplo → visualizar Specs → abrir tarefas → alterar status → salvar Markdown → reabrir e verificar persistência.

Comece lendo os documentos, depois proponha uma árvore de arquivos e implemente a primeira fase. Não fique apenas descrevendo o que faria: produza código funcional em etapas.
