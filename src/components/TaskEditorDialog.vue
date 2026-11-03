<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PRIORITY_ITEMS, TASK_STATUS_ITEMS } from '@/app/labels'
import type { Priority, TaskStatus } from '@/domain/types'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()

const specId = ref('')
const title = ref('')
const priority = ref<Priority>('medium')
const status = ref<TaskStatus>('backlog')
const dependsOn = ref<string[]>([])
const specRefs = ref<string[]>([])
const files = ref('')
const acceptance = ref('')
const group = ref('')
const description = ref('')
const blockedReason = ref('')
const saving = ref(false)

const show = computed({
  get: () => !!ui.taskEditor,
  set: (v: boolean) => {
    if (!v) ui.taskEditor = null
  },
})
const isEdit = computed(() => ui.taskEditor?.mode === 'edit')
const spec = computed(() => project.model.specs.find((s) => s.id === specId.value))
const taskOptions = computed(() => project.model.tasks.filter((t) => t.id !== ui.taskEditor?.taskId).map((t) => ({ title: `${t.id} — ${t.title}`, value: t.id })))
const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const valid = computed(() => !!title.value.trim() && !!specId.value && (status.value !== 'blocked' || !!blockedReason.value.trim()))

watch(
  () => ui.taskEditor,
  (ed) => {
    if (!ed) return
    const t = ed.taskId ? project.taskById.get(ed.taskId) : undefined
    specId.value = t?.specId ?? ed.specId ?? project.model.specs[0]?.id ?? ''
    title.value = t?.title ?? ''
    priority.value = t?.priority ?? 'medium'
    status.value = t?.status ?? 'backlog'
    dependsOn.value = [...(t?.dependsOn ?? [])]
    specRefs.value = [...(t?.specRefs ?? [])]
    files.value = (t?.files ?? []).join('\n')
    acceptance.value = (t?.acceptance ?? []).join('\n')
    group.value = t?.parallelGroup ?? ''
    description.value = t?.description ?? ''
    blockedReason.value = t?.blockedReason ?? ''
  },
)

async function save() {
  const ed = ui.taskEditor
  if (!ed || !valid.value) return
  saving.value = true
  let ok = false
  if (ed.mode === 'create') {
    const id = await project.createTask({
      specId: specId.value,
      title: title.value.trim(),
      priority: priority.value,
      status: status.value,
      dependsOn: dependsOn.value,
      specRefs: specRefs.value,
      files: lines(files.value),
      acceptance: lines(acceptance.value),
      parallelGroup: group.value.trim() || undefined,
      description: description.value.trim() || undefined,
    })
    ok = !!id
    if (id) ui.selectedTaskId = id
  } else if (ed.taskId) {
    ok = await project.saveTask(ed.taskId, {
      title: title.value.trim(),
      priority: priority.value,
      status: status.value,
      dependsOn: dependsOn.value,
      specRefs: specRefs.value,
      files: lines(files.value),
      acceptance: lines(acceptance.value),
      parallelGroup: group.value.trim() || null,
      blockedReason: status.value === 'blocked' ? blockedReason.value.trim() : null,
    })
  }
  saving.value = false
  if (ok) ui.taskEditor = null
}
</script>

<template>
  <v-dialog v-model="show" max-width="720" scrollable>
    <v-card>
      <v-card-title class="pt-4">{{ isEdit ? `Editar ${ui.taskEditor?.taskId}` : 'Nova tarefa' }}</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="8">
            <v-select
              v-model="specId"
              :items="project.model.specs.map((s) => ({ title: `${s.id} — ${s.title}`, value: s.id }))"
              label="Spec"
              :disabled="isEdit"
            />
          </v-col>
          <v-col cols="12" md="4"><v-select v-model="priority" :items="PRIORITY_ITEMS" label="Prioridade" /></v-col>
          <v-col cols="12"><v-text-field v-model="title" label="Título" :error-messages="title.trim() ? [] : ['Obrigatório']" autofocus /></v-col>
          <v-col cols="12" md="6"><v-select v-model="status" :items="TASK_STATUS_ITEMS" label="Status" /></v-col>
          <v-col cols="12" md="6"><v-text-field v-model="group" label="Grupo paralelo (sugestão)" /></v-col>
          <v-col v-if="status === 'blocked'" cols="12">
            <v-text-field v-model="blockedReason" label="Motivo do bloqueio" :error-messages="blockedReason.trim() ? [] : ['Obrigatório para tarefas bloqueadas']" />
          </v-col>
          <v-col cols="12" md="6"><v-autocomplete v-model="dependsOn" :items="taskOptions" label="Depende de" multiple chips closable-chips /></v-col>
          <v-col cols="12" md="6">
            <v-autocomplete v-model="specRefs" :items="spec?.requirements.map((r) => ({ title: `${r.id} — ${r.text}`, value: r.id })) ?? []" label="Requisitos (spec_refs)" multiple chips closable-chips />
          </v-col>
          <v-col cols="12" md="6"><v-textarea v-model="files" label="Arquivos previstos (um por linha)" rows="3" auto-grow /></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="acceptance" label="Critérios de aceite (um por linha)" rows="3" auto-grow /></v-col>
          <v-col v-if="!isEdit" cols="12"><v-textarea v-model="description" label="Descrição / notas (Markdown)" rows="3" auto-grow /></v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="show = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" :disabled="!valid" @click="save">{{ isEdit ? 'Salvar' : 'Criar tarefa' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
