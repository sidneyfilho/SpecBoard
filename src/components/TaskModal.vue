<script setup lang="ts">
import { computed, ref } from 'vue'
import { TASK_STATUS_ITEMS } from '@/app/labels'
import TaskDetail from '@/components/TaskDetail.vue'
import type { TaskStatus } from '@/domain/types'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const reason = ref('')
const askReason = ref(false)

const show = computed({
  get: () => !!ui.selectedTask,
  set: (v: boolean) => {
    if (!v) ui.selectedTaskId = null
  },
})

async function changeStatus(s: TaskStatus) {
  const t = ui.selectedTask
  if (!t || s === t.status) return
  if (project.isDemo) return void project.say('Dados de demonstração são somente leitura. Abra um repositório para editar.', 'info')
  if (s === 'blocked') {
    reason.value = ''
    askReason.value = true
    return
  }
  await project.setTaskStatus(t.id, s)
}
async function confirmBlock() {
  const t = ui.selectedTask
  askReason.value = false
  if (t && reason.value.trim()) await project.setTaskStatus(t.id, 'blocked', reason.value.trim())
}
</script>

<template>
  <v-dialog v-model="show" max-width="920" scrollable>
    <v-card v-if="ui.selectedTask" class="sb-panel">
      <v-card-text class="pa-0">
        <v-row no-gutters>
          <v-col cols="12" md="9"><TaskDetail /></v-col>
          <v-col cols="12" md="3" class="pa-4 pt-md-14">
            <div class="text-overline text-medium-emphasis mb-1">Mover para</div>
            <v-select
              :model-value="ui.selectedTask.status"
              :items="TASK_STATUS_ITEMS"
              aria-label="Status da tarefa"
              @update:model-value="changeStatus"
            />
            <p class="text-caption text-medium-emphasis mt-3">
              Status documental: grava no <span class="sb-mono">tasks.md</span>. Nenhum agente é executado.
            </p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog v-model="askReason" max-width="420">
    <v-card title="Bloquear tarefa">
      <v-card-text><v-text-field v-model="reason" label="Motivo do bloqueio" autofocus @keyup.enter="confirmBlock" /></v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="askReason = false">Cancelar</v-btn>
        <v-btn color="error" :disabled="!reason.trim()" @click="confirmBlock">Bloquear</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
