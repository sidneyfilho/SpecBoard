<script setup lang="ts">
import { computed } from 'vue'
import { TASK_STATUS_META } from '@/app/labels'
import { TASK_STATUSES } from '@/domain/types'
import { useProjectStore } from '@/stores/project'

const project = useProjectStore()
const m = computed(() => project.metrics)
const pct = (n: number) => `${Math.round(n * 100)}%`
const rows = computed(() => [
  ['Total de tarefas identificadas', m.value.totalTasks, 'Número de blocos de tarefa válidos. Não representa o escopo futuro completo.'],
  ['Prontas para IA', m.value.readyForAi, 'status = ready E critérios de aceite + referência de requisito/arquivo.'],
  ['Cobertura do planejamento', pct(m.value.planningCoverage), 'Tarefas suficientemente especificadas ÷ total.'],
  ['Progresso documental', pct(m.value.documentalProgress), 'Tarefas com status done ÷ total. Estado manual; não comprova execução.'],
  ['Bloqueadas (explícito)', m.value.blockedExplicit, 'status = blocked.'],
  ['Bloqueadas por dependência', m.value.blockedByDependency, 'Dependência não concluída; o status original não é reescrito.'],
  ['Sem critérios de aceite', m.value.withoutAcceptance, 'Tarefas sem acceptance.'],
  ['Specs incompletas', m.value.incompleteSpecs, 'Sem requisitos, sem critérios, sem tarefas ou com tarefa não especificada.'],
  ['Adicionadas após a linha de base', m.value.addedAfterBaseline ?? 'n/d', 'Requer snapshot baseline versionado (ainda não configurado).'],
])
</script>

<template>
  <h2 class="text-h5 mb-3">Relatórios</h2>
  <v-alert v-if="m.caveat" type="warning" variant="tonal" density="compact" class="mb-3">{{ m.caveat }}</v-alert>
  <v-row>
    <v-col cols="12" md="7">
      <div class="sb-panel pa-2">
        <v-table density="compact" class="bg-transparent">
          <thead><tr><th>Métrica</th><th>Valor</th><th>Fórmula</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r[0]"><td>{{ r[0] }}</td><td class="font-weight-bold">{{ r[1] }}</td><td class="text-caption text-medium-emphasis">{{ r[2] }}</td></tr>
          </tbody>
        </v-table>
      </div>
    </v-col>
    <v-col cols="12" md="5">
      <div class="sb-panel pa-4">
        <div class="text-subtitle-2 mb-3">Tarefas por status</div>
        <div v-for="s in TASK_STATUSES" :key="s" class="mb-2">
          <div class="d-flex justify-space-between text-body-2"><span>{{ TASK_STATUS_META[s].label }}</span><span>{{ m.byStatus[s] }}</span></div>
          <v-progress-linear :model-value="m.totalTasks ? (m.byStatus[s] / m.totalTasks) * 100 : 0" :color="TASK_STATUS_META[s].color" height="6" rounded />
        </div>
      </div>
    </v-col>
  </v-row>
</template>
