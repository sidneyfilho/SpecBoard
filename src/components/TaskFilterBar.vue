<script setup lang="ts">
import { PRIORITY_ITEMS, TASK_STATUS_ITEMS } from '@/app/labels'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
</script>

<template>
  <div class="d-flex flex-wrap align-center ga-2">
    <v-menu :close-on-content-click="false">
      <template #activator="{ props }">
        <v-btn v-bind="props" variant="outlined" prepend-icon="mdi-filter-variant">
          Filtros
          <v-badge v-if="ui.hasFilters" dot color="primary" inline class="ml-1" />
        </v-btn>
      </template>
      <v-card min-width="300" class="pa-3">
        <v-select
          v-model="ui.filters.statuses"
          :items="TASK_STATUS_ITEMS"
          label="Status"
          multiple
          chips
          clearable
          class="mb-3"
        />
        <v-select
          v-model="ui.filters.priorities"
          :items="PRIORITY_ITEMS"
          label="Prioridade"
          multiple
          chips
          clearable
          class="mb-3"
        />
        <v-select
          v-model="ui.filters.specId"
          :items="project.model.specs.map((s) => ({ title: `${s.id} — ${s.title}`, value: s.id }))"
          label="Spec"
          clearable
        />
        <v-btn class="mt-3" variant="text" block :disabled="!ui.hasFilters" @click="ui.clearFilters()">Limpar filtros</v-btn>
      </v-card>
    </v-menu>
    <v-text-field
      v-model="ui.filters.query"
      style="max-width: 260px"
      prepend-inner-icon="mdi-magnify"
      placeholder="Buscar tarefas…"
      clearable
      aria-label="Buscar tarefas"
    />
    <v-chip v-if="ui.hasFilters" variant="tonal" color="primary">{{ ui.filteredTasks.length }} de {{ project.model.tasks.length }}</v-chip>
    <v-spacer />
    <v-btn color="primary" prepend-icon="mdi-plus" @click="ui.taskEditor = { mode: 'create', specId: ui.filters.specId ?? undefined }">Nova tarefa</v-btn>
  </div>
</template>
