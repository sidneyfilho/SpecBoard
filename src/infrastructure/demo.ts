import { buildModel, type FileMap } from '@/domain/model'
import type { Priority, ProjectModel, TaskStatus } from '@/domain/types'

/**
 * Dados de demonstração FICTÍCIOS (projeto "Alvorland"). São gerados como documentos
 * Markdown/YAML e interpretados pelo mesmo parser dos arquivos reais.
 */
interface DemoTask {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  deps?: string[]
  files?: string[]
  acceptance?: string[]
  group?: string
  reason?: string
}
interface DemoSpec {
  id: string
  dir: string
  title: string
  status: string
  priority: Priority
  objective: string
  reqs: string[]
  tasks: DemoTask[]
}

const A = ['Comportamento descrito na Spec implementado.', 'Testes cobrem os casos principais.']

const SPECS: DemoSpec[] = [
  {
    id: 'SPEC-001', dir: '001-mapa', title: 'Sistema de mapa', status: 'in_progress', priority: 'high',
    objective: 'Carregar mapas, tiles e regras de movimentação.',
    reqs: ['Carregar os tiles do mapa.', 'Representar colisões.', 'Validar movimentação no servidor.'],
    tasks: [
      { id: 'T001', title: 'Modelo de dados do mapa', status: 'done', priority: 'high', files: ['backend/map/MapModel.java'], acceptance: A },
      { id: 'T002', title: 'Carregamento dos tiles', status: 'done', priority: 'medium', deps: ['T001'], files: ['backend/map/MapLoader.java'], acceptance: A },
      { id: 'T003', title: 'Mapa e tilesets', status: 'ready', priority: 'high', deps: ['T002'], files: ['client/scenes/Map.gd'], acceptance: A, group: 'map' },
      { id: 'T004', title: 'Movimentação do personagem', status: 'in_progress', priority: 'high', deps: ['T003'], files: ['client/Player.gd', 'client/Collision.gd'], acceptance: A },
      { id: 'T005', title: 'Validação de colisões no servidor', status: 'review', priority: 'high', deps: ['T001'], files: ['backend/map/CollisionService.java'], acceptance: A },
    ],
  },
  {
    id: 'SPEC-002', dir: '002-inventario', title: 'Inventário', status: 'planning', priority: 'medium',
    objective: 'Itens, categorias e uso de itens.',
    reqs: ['Listar itens por categoria.', 'Usar e descartar itens.'],
    tasks: [
      { id: 'T006', title: 'Modelo de itens e categorias', status: 'ready', priority: 'medium', files: ['backend/items/Item.java'], acceptance: A },
      { id: 'T007', title: 'Interface do inventário', status: 'backlog', priority: 'medium', deps: ['T006'], files: ['client/ui/Inventory.gd'], acceptance: A },
      { id: 'T008', title: 'Persistência do inventário', status: 'backlog', priority: 'low', deps: ['T006'], files: ['backend/items/InventoryStore.java'] },
    ],
  },
  {
    id: 'SPEC-003', dir: '003-construcoes', title: 'Construções e edificações', status: 'planning', priority: 'high',
    objective: 'Construção de casas, celeiros e cercas.',
    reqs: ['Posicionar construções no mapa.', 'Consumir recursos.'],
    tasks: [
      { id: 'T009', title: 'Posicionamento de construções', status: 'backlog', priority: 'high', deps: ['T003'], files: ['client/scenes/Map.gd'], acceptance: A },
      { id: 'T010', title: 'Consumo de recursos', status: 'blocked', priority: 'medium', deps: ['T006'], reason: 'Aguardando definição da economia do jogo.', files: ['backend/build/Cost.java'], acceptance: A },
    ],
  },
  {
    id: 'SPEC-004', dir: '004-npcs', title: 'NPCs e diálogos', status: 'backlog', priority: 'low',
    objective: 'Rotinas e diálogos de NPCs.',
    reqs: [],
    tasks: [{ id: 'T011', title: 'Rotinas básicas de NPC', status: 'backlog', priority: 'low' }],
  },
]

function render(spec: DemoSpec): FileMap {
  const f = (path: string, content: string) => ({ [path]: { path, content, hash: `demo:${path}` } })
  const specMd =
    `---\nid: ${spec.id}\ntitle: ${spec.title}\nstatus: ${spec.status}\npriority: ${spec.priority}\n---\n\n# ${spec.title}\n\n## Objetivo\n${spec.objective}\n\n## Requisitos\n` +
    spec.reqs.map((r, i) => `- REQ-${String(i + 1).padStart(3, '0')}: ${r}`).join('\n') +
    `\n\n## Critérios de aceite\n- [ ] Comportamento validado.\n- [ ] Testes passam.\n`
  const tasksMd =
    `# Tarefas — ${spec.id}\n\n` +
    spec.tasks
      .map((t) => {
        const y = [
          `id: ${t.id}`, `status: ${t.status}`, `priority: ${t.priority}`, `depends_on: [${(t.deps ?? []).join(', ')}]`,
          ...(t.group ? [`parallel_group: ${t.group}`] : []),
          ...(t.reason ? [`blocked_reason: ${t.reason}`] : []),
          `spec_refs: [${spec.reqs.length ? 'REQ-001' : ''}]`,
          `files: [${(t.files ?? []).join(', ')}]`,
          `acceptance:${t.acceptance ? '\n' + t.acceptance.map((a) => `  - ${a}`).join('\n') : ' []'}`,
        ].join('\n')
        return `## ${t.id} — ${t.title}\n<!-- task:begin -->\n${y}\n<!-- task:end -->\n`
      })
      .join('\n')
  return {
    ...f(`specs/${spec.dir}/spec.md`, specMd),
    ...f(`specs/${spec.dir}/plan.md`, `# Plano técnico — ${spec.id}\n\n## Abordagem proposta\n1. Definir modelo.\n2. Implementar.\n3. Testar.\n`),
    ...f(`specs/${spec.dir}/tasks.md`, tasksMd),
  }
}

export function buildDemoModel(): ProjectModel {
  let files: FileMap = {
    '.specboard/project.yaml': {
      path: '.specboard/project.yaml',
      hash: 'demo:project',
      content: 'id: alvorland-demo\nname: Alvorland\ndescription: Jogo 2D de construção, fazenda e cidade (dados de demonstração)\nspecs_directory: specs\nconstitution_path: .specboard/constitution.md\nagent_instructions_path: AGENTS.md\n',
    },
    '.specboard/constitution.md': { path: '.specboard/constitution.md', hash: 'demo:c', content: '# Constituição (demo)\n\n- Cliente em Godot, backend em Java.\n' },
    'AGENTS.md': { path: 'AGENTS.md', hash: 'demo:a', content: '# Instruções dos agentes (demo)\n\nLeia a Spec antes de implementar.\n' },
  }
  for (const s of SPECS) files = { ...files, ...render(s) }
  return buildModel('demo://alvorland', files, true)
}
