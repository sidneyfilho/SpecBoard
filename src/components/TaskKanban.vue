<script setup lang="ts">
import { computed, ref } from 'vue'
import { TASK_STATUS_META } from '@/app/labels'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/domain/types'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'
import TaskCard from './TaskCard.vue'

const props = defineProps<{ tasks: Task[]; height?: string }>()
const project = useProjectStore()
const ui = useUiStore()

const dragId = ref<string | null>(null)
const overCol = ref<TaskStatus | null>(null)
const blockDialog = ref<{ id: string } | null>(null)
const reason = ref('')

const columns = computed(() =>
  TASK_STATUSES.map((s) => ({ status: s, meta: TASK_STATUS_META[s], items: props.tasks.filter((t) => t.status === s) })),
)

async function move(id: string, status: TaskStatus) {
  if (project.isDemo) return void project.say('Dados de demonstração são somente leitura. Abra um repositório para editar.', 'info')
  if (status === 'blocked') {
    reason.value = ''
    blockDialog.value = { id }
    return
  }
  await project.setTaskStatus(id, status)
}
async function confirmBlock() {
  if (!blockDialog.value || !reason.value.trim()) return
  const id = blockDialog.value.id
  blockDialog.value = null
  await project.setTaskStatus(id, 'blocked', reason.value.trim())
}
function onDrop(status: TaskStatus) {
  const id = dragId.value
  overCol.value = null
  dragId.value = null
  if (id) void move(id, status)
}
</script>

<template>
  <div class="sb-board" :style="{ height }" role="list">
    <section
      v-for="c in columns"
      :key="c.status"
      class="sb-col"
      :class="{ 'drop-target': overCol === c.status }"
      role="listitem"
      :aria-label="`${c.meta.label}, ${c.items.length} tarefas`"
      @dragover.prevent="overCol = c.status"
      @dragleave="overCol === c.status && (overCol = null)"
      @drop.prevent="onDrop(c.status)"
    >
      <header class="d-flex align-center ga-2 pa-3 pb-1">
        <v-icon :icon="c.meta.icon" :color="c.meta.color" size="18" />
        <span class="text-subtitle-2 font-weight-bold">{{ c.meta.label }}</span>
        <v-spacer />
        <v-chip :color="c.meta.color" variant="tonal">{{ c.items.length }}</v-chip>
      </header>
      <div class="sb-col-body">
        <TaskCard
          v-for="t in c.items"
          :key="t.id"
          :task="t"
          :selected="ui.selectedTaskId === t.id"
          :dragging="dragId === t.id"
          draggable="true"
          @dragstart="dragId = t.id"
          @dragend="dragId = null; overCol = null"
          @select="ui.selectedTaskId = t.id"
          @move="(s) => move(t.id, s)"
          @edit="ui.taskEditor = { mode: 'edit', taskId: t.id }"
        />
        <div v-if="!c.items.length" class="text-caption text-medium-emphasis text-center py-3">
          {{ ui.hasFilters ? 'Nenhum resultado' : 'Sem tarefas' }}
        </div>
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-plus"
          class="text-medium-emphasis"
          @click="ui.taskEditor = { mode: 'create', specId: ui.filters.specId ?? undefined }"
        >
          Adicionar tarefa
        </v-btn>
      </div>
    </section>
  </div>

  <v-dialog :model-value="!!blockDialog" max-width="420" @update:model-value="blockDialog = null">
    <v-card title="Bloquear tarefa">
      <v-card-text>
        <v-text-field v-model="reason" label="Motivo do bloqueio" autofocus @keyup.enter="confirmBlock" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="blockDialog = null">Cancelar</v-btn>
        <v-btn color="error" :disabled="!reason.trim()" @click="confirmBlock">Bloquear</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
