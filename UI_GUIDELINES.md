# Diretrizes visuais — SpecBoard

## Referência principal
`reference/specboard-dark-dashboard-primary.png`

Use a imagem como direção visual, não como uma imagem para reproduzir literalmente. Criar componentes reais e layout responsivo; não colocar a captura de tela como fundo da aplicação.

## Estilo
- Dark mode por padrão.
- Background: azul-marinho quase preto.
- Superfícies: painéis azul-petróleo/carvão, bordas frias e discretas.
- Accent principal: azul elétrico; acentos violetas discretos.
- Verde para concluído/pronto, âmbar para atenção, vermelho para bloqueios, ciano para informação.
- Gradientes somente em elementos de foco e indicadores; evitar glow excessivo.
- Cards com bordas sutis, radius médio e elevação mínima.
- Tipografia clara e compacta, com títulos bem hierarquizados.
- Ícones lineares consistentes; não usar emoji como ícone de navegação.
- Transições de 120–200ms, respeitando prefers-reduced-motion.

## Shell
- Sidebar esquerda com logo, seletor de projeto e navegação:
  Visão Geral, Especificações, Tarefas, Kanban, Cronograma, Dependências, Arquivos, Relatórios, Configurações.
- Área superior com projeto atual, branch Git, busca, tema e menu.
- Conteúdo principal com título, descrição, ações e métricas.
- Layout de dashboard denso, mas legível em 1440px.
- Sidebar pode recolher; em telas menores vira drawer.

## Dashboard
- Cards de métricas: Specs, tarefas identificadas, prontas para IA, concluídas e bloqueadas.
- Progresso global claramente identificado como progresso documental.
- Kanban como foco principal.
- Contadores por coluna.
- Botões de filtro, busca e nova Spec/tarefa.
- Detalhes do item selecionado em painel inferior ou lateral.
- Painel auxiliar para dependências, arquivos e ações rápidas.

## Kanban
- Colunas Backlog, Em planejamento, Pronto para IA, Em execução (documental/manual), Em revisão, Concluído e Bloqueado.
- O conjunto de status pode ser configurável; não precisa mostrar todas as colunas simultaneamente em telas estreitas.
- Cartões mostram ID, título, resumo, prioridade, Spec relacionada, dependências e progresso dos critérios.
- Drag-and-drop com suporte a teclado ou alternativa acessível.
- Não comunicar execução real de agentes; mostrar status documental/manual.

## Tela de detalhe da Spec
Abas:
- Visão geral
- Especificação
- Plano
- Tarefas
- Dependências
- Arquivos
- Histórico

Permitir editor Markdown com preview e indicador de alterações não salvas.

## Tela de detalhe da tarefa
Mostrar:
- ID e título;
- status e prioridade;
- descrição;
- critérios de aceite;
- dependências;
- referências de requisito;
- arquivos previstos;
- notas;
- botão “Copiar contexto para IA”;
- aviso de conflito se arquivo foi alterado externamente.

## Estados obrigatórios
- Loading.
- Nenhum projeto selecionado.
- Projeto vazio.
- Erro de parsing com arquivo e motivo.
- Alterações externas.
- Conflito de gravação.
- Sucesso de salvamento.
- Nenhum resultado de pesquisa.
- Tela responsiva.

## Dados de demonstração
Usar Alvorland como projeto de demonstração, com tarefas fictícias sobre mapa, inventário, construções, NPCs e interface. Exibir uma indicação de “dados de demonstração” até um repositório real ser aberto.
