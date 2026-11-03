<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'

const project = useProjectStore()
const m = computed(() => project.metrics)
const pct = (n: number) => Math.round(n * 100)
const cards = computed(() => [
  { title: 'Especificações', value: m.value.totalSpecs, sub: `${m.value.incompleteSpecs} incompleta(s)`, icon: 'mdi-file-document-outline', color: 'secondary' },
  { title: 'Tarefas identificadas', value: m.value.totalTasks, sub: `${m.value.done} concluída(s) (documental)`, icon: 'mdi-format-list-checks', color: 'primary' },
  { title: 'Prontas para IA', value: m.value.readyForAi, sub: `${pct(m.value.planningCoverage)}% especificadas`, icon: 'mdi-check-circle-outline', color: 'success' },
  { title: 'Em execução (manual)', value: m.value.byStatus.in_progress, sub: `${m.value.byStatus.review} em revisão`, icon: 'mdi-progress-clock', color: 'warning' },
  {
    title: 'Bloqueadas',
    value: m.value.blockedExplicit,
    sub: `+${m.value.blockedByDependency} aguardando dependência`,
    icon: 'mdi-alert-circle-outline',
    color: 'error',
  },
])
</script>

<template>
  <v-row dense class="mb-3">
    <v-col cols="12" md="4" lg="3">
      <div class="sb-panel pa-4 d-flex align-center ga-4 h-100">
        <v-progress-circular :model-value="pct(m.documentalProgress)" :size="72" :width="7" color="success">
          <span class="text-h6 font-weight-bold">{{ pct(m.documentalProgress) }}%</span>
        </v-progress-circular>
        <div>
          <div class="text-subtitle-2 font-weight-bold">Progresso documental</div>
          <div class="text-body-2">{{ m.done }} / {{ m.totalTasks }} tarefas marcadas como concluídas</div>
          <div class="text-caption text-medium-emphasis">Status manual; não comprova execução ou testes.</div>
        </div>
      </div>
    </v-col>
    <v-col v-for="c in cards" :key="c.title" cols="6" sm="4" md="4" lg>
      <div class="sb-panel pa-4 h-100">
        <div class="d-flex justify-space-between align-start">
          <div class="text-body-2 font-weight-medium">{{ c.title }}</div>
          <div class="sb-metric-icon" :style="{ background: `rgba(var(--v-theme-${c.color}), 0.18)` }">
            <v-icon :icon="c.icon" :color="c.color" size="20" />
          </div>
        </div>
        <div class="text-h4 font-weight-bold my-1">{{ c.value }}</div>
        <div class="text-caption text-medium-emphasis">{{ c.sub }}</div>
      </div>
    </v-col>
  </v-row>
  <v-alert v-if="m.caveat" type="warning" variant="tonal" density="compact" class="mb-3">{{ m.caveat }}</v-alert>
</template>
