<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PRIORITY_ITEMS, PRIORITY_META, SPEC_STATUS_META } from '@/app/labels'
import { isSpecified } from '@/domain/dependencies'
import { SPEC_STATUSES, type Priority, type Spec, type SpecStatus } from '@/domain/types'
import { useProjectStore } from '@/stores/project'

const project = useProjectStore()
const router = useRouter()
const dragId = ref<string | null>(null)
const overCol = ref<SpecStatus | null>(null)
const dialog = ref(false)
const title = ref('')
const priority = ref<Priority>('medium')
const creating = ref(false)

const columns = computed(() =>
  SPEC_STATUSES.map((s) => ({ status: s, meta: SPEC_STATUS_META[s], items: project.model.specs.filter((x) => x.status === s) })),
)

function stats(s: Spec) {
  const ts = project.model.tasks.filter((t) => t.specId === s.id)
  const done = ts.filter((t) => t.status === 'done').length
  return { total: ts.length, done, ready: ts.filter(isSpecified).length, pct: ts.length ? Math.round((done / ts.length) * 100) : 0 }
}
async function move(id: string, status: SpecStatus) {
  if (project.isDemo) return void project.say('Dados de demonstração são somente leitura. Abra um repositório para editar.', 'info')
  await project.setSpecStatus(id, status)
}
function onDrop(status: SpecStatus) {
  const id = dragId.value
  overCol.value = null
  dragId.value = null
  if (id) void move(id, status)
}
async function create() {
  creating.value = true
  const id = await project.createSpec(title.value.trim(), priority.value)
  creating.value = false
  if (id) {
    dialog.value = false
    title.value = ''
    void router.push(`/specs/${id}`)
  }
}
</script>

<template>
  <div class="d-flex align-center mb-3 ga-3">
    <h2 class="text-h5">Especificações</h2>
    <v-spacer />
    <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">Nova Spec</v-btn>
  </div>
  <div v-if="!project.model.specs.length" class="sb-panel pa-8 text-center">
    <v-icon icon="mdi-file-document-plus-outline" size="48" class="mb-2" />
    <div class="text-h6">Nenhuma Spec</div>
    <p class="text-medium-emphasis">Crie a primeira Spec a partir do template.</p>
  </div>
  <div v-else class="sb-board">
    <section
      v-for="c in columns"
      :key="c.status"
      class="sb-col"
      :class="{ 'drop-target': overCol === c.status }"
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
        <div
          v-for="s in c.items"
          :key="s.id"
          class="sb-card"
          :class="{ dragging: dragId === s.id }"
          draggable="true"
          tabindex="0"
          role="link"
          @dragstart="dragId = s.id"
          @dragend="dragId = null"
          @click="router.push(`/specs/${s.id}`)"
          @keydown.enter="router.push(`/specs/${s.id}`)"
        >
          <div class="d-flex align-center justify-space-between">
            <span class="text-caption font-weight-bold text-medium-emphasis">{{ s.id }}</span>
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon size="x-small" variant="text" aria-label="Mover Spec" @click.stop><v-icon icon="mdi-dots-horizontal" /></v-btn>
              </template>
              <v-list density="compact">
                <v-list-subheader>Mover para</v-list-subheader>
                <v-list-item v-for="st in SPEC_STATUSES" :key="st" :disabled="st === s.status" :title="SPEC_STATUS_META[st].label" @click="move(s.id, st)" />
              </v-list>
            </v-menu>
          </div>
          <div class="text-body-2 font-weight-medium mb-2">{{ s.title }}</div>
          <v-progress-linear :model-value="stats(s).pct" height="4" rounded color="success" class="mb-2" />
          <div class="d-flex align-center ga-1 flex-wrap">
            <v-chip :color="PRIORITY_META[s.priority].color" variant="tonal">{{ PRIORITY_META[s.priority].label }}</v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ stats(s).done }}/{{ stats(s).total }} tarefas · {{ stats(s).ready }} prontas</span>
          </div>
        </div>
        <div v-if="!c.items.length" class="text-caption text-medium-emphasis text-center py-3">Sem Specs</div>
      </div>
    </section>
  </div>

  <v-dialog v-model="dialog" max-width="460">
    <v-card title="Nova Spec">
      <v-card-text>
        <v-text-field v-model="title" label="Título" autofocus class="mb-3" @keyup.enter="title.trim() && create()" />
        <v-select v-model="priority" :items="PRIORITY_ITEMS" label="Prioridade" />
        <p class="text-caption text-medium-emphasis mt-3">Cria spec.md, plan.md e tasks.md a partir de templates, sem sobrescrever arquivos existentes.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="creating" :disabled="!title.trim()" @click="create">Criar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
