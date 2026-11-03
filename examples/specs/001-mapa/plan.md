# Plano técnico — SPEC-001

## Contexto
O jogo usa Godot no cliente e Java no backend.

## Abordagem proposta
1. Definir modelo canônico de tile e mapa.
2. Implementar leitura e validação dos dados no backend.
3. Definir mensagem de movimentação via WebSocket.
4. Integrar o cliente Godot.
5. Adicionar testes para colisão e sincronização.

## Decisões pendentes
- Formato final de armazenamento do mapa.
- Identificação e versionamento dos tilesets.
- Estratégia de envio de atualizações para múltiplos clientes.

## Riscos
- Divergência entre colisão visual e colisão autoritativa do servidor.
- Alterações simultâneas no formato de mapa e no protocolo.
