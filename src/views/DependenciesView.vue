<script setup lang="ts">
import { computed } from 'vue'
import { TASK_STATUS_META } from '@/app/labels'
import { layoutGraph } from '@/domain/graph-layout'
import { isBlockedByDependency } from '@/domain/dependencies'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const W = 168
const H = 44
const GX = 70
const GY = 16

const nodes = computed(() => layoutGraph(project.model.tasks))
const pos = computed(() => new Map(nodes.value.map((n) => [n.id, { x: 16 + n.level * (W + GX), y: 16 + n.row * (H + GY) }])))
const size = computed(() => ({
  w: 32 + (Math.max(0, ...nodes.value.map((n) => n.level)) + 1) * (W + GX),
  h: 32 + (Math.max(0, ...nodes.value.map((n) => n.row)) + 1) * (H + GY),
}))
const edges = computed(() =>
  project.model.tasks.flatMap((t) =>
    t.dependsOn.filter((d) => pos.value.has(d)).map((d) => {
      const a = pos.value.get(d)!
      const b = pos.value.get(t.id)!
      return { key: `${d}>${t.id}`, d: `M${a.x + W},${a.y + H / 2} C${a.x + W + GX / 2},${a.y + H / 2} ${b.x - GX / 2},${b.y + H / 2} ${b.x},${b.y + H / 2}` }
    }),
  ),
)
const cssColor = (c: string) => `rgb(var(--v-theme-${c === 'grey' ? 'on-surface-variant' : c}))`
const a = computed(() => project.analysis)
const nodeColor = (id: string) => {
  const t = project.taskById.get(id)!
  return cssColor(isBlockedByDependency(t, project.taskById) && t.status !== 'blocked' ? 'warning' : TASK_STATUS_META[t.status].color)
}
const cycleIds = computed(() => new Set(a.value.cycles.flat()))
</script>

<template>
  <h2 class="text-h5 mb-3">Dependências</h2>
  <v-row>
    <v-col cols="12" lg="8">
      <div class="sb-panel pa-2" style="overflow: auto; max-height: 560px">
        <div v-if="!project.model.tasks.length" class="pa-6 text-center text-medium-emphasis">Sem tarefas.</div>
        <svg v-else :width="size.w" :height="size.h" role="img" aria-label="Grafo de dependências entre tarefas">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="rgb(var(--v-theme-on-surface-variant))" />
            </marker>
          </defs>
          <path v-for="e in edges" :key="e.key" :d="e.d" fill="none" stroke="rgb(var(--v-theme-on-surface-variant))" stroke-opacity="0.55" marker-end="url(#arrow)" />
          <g
            v-for="n in nodes"
            :key="n.id"
            :transform="`translate(${pos.get(n.id)!.x},${pos.get(n.id)!.y})`"
            style="cursor: pointer"
            tabindex="0"
            role="button"
            :aria-label="`${n.id} ${project.taskById.get(n.id)!.title}`"
            @click="ui.selectedTaskId = n.id"
            @keydown.enter="ui.selectedTaskId = n.id"
          >
            <rect :width="W" :height="H" rx="8" fill="rgb(var(--v-theme-surface-variant))" :stroke="cycleIds.has(n.id) ? cssColor('error') : nodeColor(n.id)" stroke-width="2" />
            <text x="10" y="18" font-size="11" font-weight="700" fill="rgb(var(--v-theme-on-surface))">{{ n.id }}</text>
            <text x="10" y="34" font-size="11" fill="rgb(var(--v-theme-on-surface-variant))">{{ project.taskById.get(n.id)!.title.slice(0, 24) }}</text>
          </g>
        </svg>
      </div>
      <div class="d-flex flex-wrap ga-3 mt-2 text-caption">
        <span v-for="(m, k) in TASK_STATUS_META" :key="k" class="d-flex align-center ga-1"><v-icon icon="mdi-square-rounded" size="12" :color="m.color" />{{ m.label }}</span>
        <span class="d-flex align-center ga-1"><v-icon icon="mdi-square-rounded" size="12" color="warning" />bloqueada por dependência</span>
      </div>
    </v-col>
    <v-col cols="12" lg="4">
      <div class="sb-panel pa-4 mb-3">
        <div class="text-subtitle-2 mb-2">Problemas no grafo</div>
        <div v-if="!a.missing.length && !a.cycles.length && !a.fileConflicts.length" class="text-success text-body-2"><v-icon icon="mdi-check-circle" size="16" /> Nenhum problema detectado.</div>
        <v-alert v-for="m in a.missing" :key="m.task + m.dep" type="error" variant="tonal" density="compact" class="mb-1">{{ m.task }} depende de <strong>{{ m.dep }}</strong> (inexistente).</v-alert>
        <v-alert v-for="c in a.cycles" :key="c.join()" type="error" variant="tonal" density="compact" class="mb-1">Ciclo: {{ c.join(' → ') }}</v-alert>
        <v-alert v-for="f in a.fileConflicts" :key="f.tasks.join()" type="warning" variant="tonal" density="compact" class="mb-1">
          Risco de conflito: {{ f.tasks.join(', ') }} alteram <span class="sb-mono">{{ f.files.join(', ') }}</span>.
        </v-alert>
      </div>
      <div class="sb-panel pa-4">
        <div class="text-subtitle-2 mb-1">Candidatas a trabalho paralelo</div>
        <div class="text-caption text-medium-emphasis mb-2">Dependências satisfeitas, especificadas e sem sobreposição de arquivos. <code>parallel_group</code> é só uma sugestão.</div>
        <div v-if="!project.parallel.length" class="text-medium-emphasis text-body-2">Nenhuma no momento.</div>
        <div v-for="t in project.parallel" :key="t.id" class="py-1 d-flex align-center ga-2">
          <v-chip variant="outlined">{{ t.id }}</v-chip><span class="text-body-2">{{ t.title }}</span>
          <v-chip v-if="t.parallelGroup" size="x-small" variant="tonal">{{ t.parallelGroup }}</v-chip>
        </div>
      </div>
    </v-col>
  </v-row>
</template>
