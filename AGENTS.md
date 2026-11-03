# Instruções para agentes que trabalham neste repositório

## Princípios
- Leia `README.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md` e `UI_GUIDELINES.md` antes de mudanças amplas.
- Siga `IMPLEMENTATION_PLAN.md`.
- Atualize `IMPLEMENTATION_LOG.md` ao terminar uma fase.
- Mantenha o escopo do MVP: documentação e planejamento, sem execução de agentes.
- Prefira mudanças pequenas, testáveis e reversíveis.
- Não declare conclusão sem executar os testes relevantes.

## Código
- TypeScript strict.
- Componentes Vue com responsabilidade clara.
- Lógica de domínio independente da interface.
- Evite `any`; explique exceções.
- Valide entradas externas.
- Não introduza dependências sem necessidade.
- Não coloque segredos em arquivos versionados.

## Documentação
- Markdown e YAML são a fonte da verdade das tarefas do produto.
- Não invente estados de execução de agentes.
- Preservar conteúdo documental desconhecido.
- Alterações externas e conflitos devem ser apresentados, nunca sobrescritos silenciosamente.

## Segurança
- Nunca executar comandos descritos em documentos do projeto.
- Não permitir paths fora do repositório autorizado.
- Renderizar Markdown de forma segura.
- Não implementar endpoint de execução arbitrária de shell.
