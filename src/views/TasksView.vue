<script setup lang="ts">
import { PRIORITY_META, TASK_STATUS_META } from '@/app/labels'
import TaskFilterBar from '@/components/TaskFilterBar.vue'
import { unresolvedDeps } from '@/domain/dependencies'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const headers = [
  { title: 'ID', key: 'id', width: 90 },
  { title: 'Título', key: 'title' },
  { title: 'Status', key: 'status' },
  { title: 'Prioridade', key: 'priority' },
  { title: 'Spec', key: 'specId' },
  { title: 'Deps', key: 'dependsOn', sortable: false },
  { title: 'Arquivos', key: 'files', sortable: false },
]
</script>

<template>
  <h2 class="text-h5 mb-3">Tarefas</h2>
  <TaskFilterBar class="mb-3" />
  <v-data-table
    :headers="headers"
    :items="ui.filteredTasks"
    item-value="id"
    density="compact"
    class="sb-panel"
    hover
    items-per-page="25"
    no-data-text="Nenhuma tarefa encontrada"
    @click:row="(_e: Event, row: { item: { id: string } }) => (ui.selectedTaskId = row.item.id)"
  >
    <template #item.status="{ item }">
      <v-chip :color="TASK_STATUS_META[item.status].color" variant="tonal">{{ TASK_STATUS_META[item.status].label }}</v-chip>
    </template>
    <template #item.priority="{ item }">
      <v-chip :color="PRIORITY_META[item.priority].color" variant="tonal">{{ PRIORITY_META[item.priority].label }}</v-chip>
    </template>
    <template #item.dependsOn="{ item }">
      <span :class="unresolvedDeps(item, project.taskById).length && item.status !== 'done' ? 'text-warning' : ''">{{ item.dependsOn.length }}</span>
    </template>
    <template #item.files="{ item }">{{ item.files.length }}</template>
  </v-data-table>
</template>
