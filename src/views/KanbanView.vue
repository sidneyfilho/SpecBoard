<script setup lang="ts">
import TaskFilterBar from '@/components/TaskFilterBar.vue'
import TaskKanban from '@/components/TaskKanban.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <h2 class="text-h5 mb-3">Kanban</h2>
  <TaskFilterBar class="mb-3" />
  <v-alert v-if="ui.hasFilters && !ui.filteredTasks.length" type="info" variant="tonal" density="compact" class="mb-3">
    Nenhum resultado para os filtros atuais.
  </v-alert>
  <TaskKanban :tasks="ui.filteredTasks" />
</template>
