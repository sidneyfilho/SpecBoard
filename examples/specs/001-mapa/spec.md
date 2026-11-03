---
id: SPEC-001
title: Sistema de mapa
status: planning
priority: high
---

# Sistema de mapa

## Objetivo
Definir o carregamento do mapa, os tiles e as regras de movimentação.

## Problema
O jogo precisa representar o mapa de forma consistente e impedir que o personagem atravesse obstáculos.

## Requisitos
- REQ-001: carregar os tiles do mapa.
- REQ-002: representar colisões.
- REQ-003: validar movimentação no servidor.
- REQ-004: sincronizar movimento com os clientes conectados.

## Critérios de aceite
- [ ] Tiles são carregados a partir do formato definido.
- [ ] Tiles sólidos impedem movimento.
- [ ] O servidor valida as posições.
- [ ] Clientes recebem atualização de movimento.

## Fora do escopo
- Combate.
- Inventário.
- Pathfinding avançado.
