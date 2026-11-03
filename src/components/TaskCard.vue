<script setup lang="ts">
import { computed } from 'vue'
import { PRIORITY_META, TASK_STATUS_META } from '@/app/labels'
import { unresolvedDeps } from '@/domain/dependencies'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/domain/types'
import { useProjectStore } from '@/stores/project'

const props = defineProps<{ task: Task; selected?: boolean; dragging?: boolean }>()
const emit = defineEmits<{ select: []; move: [status: TaskStatus]; edit: [] }>()
const project = useProjectStore()

const pending = computed(() => unresolvedDeps(props.task, project.taskById))
const summary = computed(() => props.task.description || props.task.acceptance[0] || '')
const pm = computed(() => PRIORITY_META[props.task.priority])

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('select')
  } else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    e.preventDefault()
    const i = TASK_STATUSES.indexOf(props.task.status) + (e.key === 'ArrowRight' ? 1 : -1)
    const next = TASK_STATUSES[i]
    if (next) emit('move', next)
  }
}
</script>

<template>
  <div
    class="sb-card"
    :class="{ selected, dragging }"
    role="button"
    tabindex="0"
    :aria-label="`${task.id} ${task.title}, ${TASK_STATUS_META[task.status].label}. Alt+setas para mover.`"
    @click="emit('select')"
    @keydown="onKey"
  >
    <div class="d-flex align-center justify-space-between">
      <span class="text-caption font-weight-bold text-medium-emphasis">{{ task.id }}</span>
      <v-menu>
        <template #activator="{ props: mp }">
          <v-btn v-bind="mp" icon size="x-small" variant="text" aria-label="Ações da tarefa" @click.stop><v-icon icon="mdi-dots-horizontal" /></v-btn>
        </template>
        <v-list density="compact">
          <v-list-subheader>Mover para</v-list-subheader>
          <v-list-item
            v-for="s in TASK_STATUSES"
            :key="s"
            :disabled="s === task.status"
            :prepend-icon="TASK_STATUS_META[s].icon"
            :title="TASK_STATUS_META[s].label"
            @click="emit('move', s)"
          />
          <v-divider />
          <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="emit('edit')" />
        </v-list>
      </v-menu>
    </div>
    <div class="text-body-2 font-weight-medium mb-1">{{ task.title }}</div>
    <div v-if="summary" class="text-caption text-medium-emphasis sb-truncate-2 mb-2">{{ summary }}</div>
    <div class="d-flex flex-wrap align-center ga-1">
      <v-chip :color="pm.color" variant="tonal">{{ pm.label }}</v-chip>
      <v-chip variant="outlined">{{ task.specId }}</v-chip>
      <v-spacer />
      <span v-if="pending.length && task.status !== 'done'" class="text-caption text-warning d-flex align-center" :title="`Aguardando ${pending.join(', ')}`">
        <v-icon icon="mdi-lock-outline" size="14" class="mr-1" />{{ pending.length }}
      </span>
      <span class="text-caption text-medium-emphasis d-flex align-center" :title="`${task.acceptance.length} critério(s) de aceite`">
        <v-icon icon="mdi-check-circle-outline" size="14" class="mr-1" />{{ task.acceptance.length }}
      </span>
      <span class="text-caption text-medium-emphasis d-flex align-center" :title="`${task.files.length} arquivo(s)`">
        <v-icon icon="mdi-file-outline" size="14" class="mr-1" />{{ task.files.length }}
      </span>
    </div>
    <div v-if="task.status === 'blocked' && task.blockedReason" class="text-caption text-error mt-1">{{ task.blockedReason }}</div>
  </div>
</template>
