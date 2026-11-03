<script setup lang="ts">
import { computed } from 'vue'
import MetricCards from '@/components/MetricCards.vue'
import TaskFilterBar from '@/components/TaskFilterBar.vue'
import TaskKanban from '@/components/TaskKanban.vue'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const empty = computed(() => project.model.specs.length === 0)
</script>

<template>
  <div v-if="empty" class="sb-panel pa-8 text-center">
    <v-icon icon="mdi-folder-open-outline" size="48" class="mb-2" />
    <div class="text-h6">Projeto vazio</div>
    <p class="text-medium-emphasis mb-4">Nenhuma Spec encontrada. Crie a primeira Spec a partir de um template.</p>
    <v-btn color="primary" to="/specs">Ir para Especificações</v-btn>
  </div>
  <template v-else>
    <!-- Banner de Capa do Projeto -->
    <div
      class="sb-panel mb-4 overflow-hidden position-relative d-flex flex-column justify-end"
      :style="{
        minHeight: '120px',
        maxHeight: '180px',
        backgroundImage: ui.currentCover ? `linear-gradient(to bottom, rgba(7, 12, 26, 0.2), rgba(7, 12, 26, 0.85)), url(${ui.currentCover})` : 'linear-gradient(135deg, rgba(59, 108, 255, 0.2), rgba(139, 92, 246, 0.2))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
    >
      <div class="pa-4 d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-3">
          <v-avatar size="52" rounded="lg" color="surface" class="border elevation-2">
            <v-img v-if="ui.currentLogo" :src="ui.currentLogo" cover />
            <v-icon v-else icon="mdi-view-dashboard-variant" size="28" color="primary" />
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold d-flex align-center ga-2">
              {{ project.model.project.name }}
              <v-chip v-if="project.isDemo" size="x-small" color="info" variant="tonal">demo</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">{{ project.model.project.description }}</div>
          </div>
        </div>

        <div>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-image-edit-outline"
            @click="ui.mediaDialog = true"
          >
            Alterar capa e logo
          </v-btn>
        </div>
      </div>
    </div>

    <MetricCards />
    <div class="d-flex align-center mb-3 ga-3 flex-wrap">
      <h2 class="text-h6">Kanban de tarefas</h2>
      <v-spacer />
    </div>
    <TaskFilterBar class="mb-3" />
    <v-alert v-if="ui.hasFilters && !ui.filteredTasks.length" type="info" variant="tonal" density="compact" class="mb-3">
      Nenhum resultado para os filtros atuais.
    </v-alert>
    <TaskKanban :tasks="ui.filteredTasks" />
  </template>
</template>
