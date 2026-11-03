# Tarefas — SPEC-001

## T001 — Definir modelo de dados do mapa
<!-- task:begin -->
id: T001
status: ready
priority: high
depends_on: []
parallel_group: map-foundation
spec_refs: [REQ-001]
files:
  - backend/src/main/java/map/MapModel.java
acceptance:
  - O modelo representa dimensões e tiles.
  - Dados inválidos são rejeitados.
<!-- task:end -->

## T002 — Implementar carregamento dos tiles
<!-- task:begin -->
id: T002
status: backlog
priority: high
depends_on: [T001]
parallel_group: map-loading
spec_refs: [REQ-001]
files:
  - backend/src/main/java/map/MapLoader.java
acceptance:
  - O mapa é carregado a partir do formato definido.
  - Erros de formato são reportados com contexto.
<!-- task:end -->

## T003 — Implementar validação de colisões
<!-- task:begin -->
id: T003
status: backlog
priority: high
depends_on: [T001, T002]
parallel_group: map-rules
spec_refs: [REQ-002, REQ-003]
files:
  - backend/src/main/java/map/CollisionService.java
acceptance:
  - Tiles sólidos bloqueiam movimento.
  - Tiles transitáveis permitem movimento.
  - Há testes para os dois casos.
<!-- task:end -->

## T004 — Definir mensagem WebSocket de movimentação
<!-- task:begin -->
id: T004
status: backlog
priority: medium
depends_on: [T001]
parallel_group: map-protocol
spec_refs: [REQ-004]
files:
  - backend/src/main/java/network/MovementMessage.java
acceptance:
  - O contrato da mensagem é documentado.
  - Campos obrigatórios são validados.
<!-- task:end -->
