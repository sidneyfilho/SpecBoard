<script setup lang="ts">
import { computed, ref } from 'vue'
import { PRIORITY_META, TASK_STATUS_META } from '@/app/labels'
import { isBlockedByDependency, isSpecified } from '@/domain/dependencies'
import { buildAgentContext } from '@/domain/context'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'
import MarkdownPreview from './MarkdownPreview.vue'

const project = useProjectStore()
const ui = useUiStore()
const tab = ref('desc')
const t = computed(() => ui.selectedTask)
const spec = computed(() => project.model.specs.find((s) => s.id === t.value?.specId))
const blockedByDep = computed(() => (t.value ? isBlockedByDependency(t.value, project.taskById) : false))
const external = computed(() => (t.value ? project.externalChanges.includes(t.value.tasksPath) : false))

async function copyContext() {
  if (!t.value) return
  try {
    const md = buildAgentContext(project.model, t.value.id)
    await navigator.clipboard.writeText(md)
    project.say('Contexto copiado. Cole no seu agente; o SpecBoard não executa agentes.')
  } catch {
    project.say('Não foi possível copiar para a área de transferência.', 'error')
  }
}
</script>

<template>
  <div v-if="t" class="pa-4">
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <v-btn icon size="small" variant="text" aria-label="Fechar detalhes" @click="ui.selectedTaskId = null"><v-icon icon="mdi-close" /></v-btn>
      <span class="text-caption text-medium-emphasis">{{ t.specId }} · {{ spec?.title }}</span>
      <v-spacer />
      <v-btn variant="tonal" color="primary" prepend-icon="mdi-content-copy" @click="copyContext">Copiar contexto para IA</v-btn>
      <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="ui.taskEditor = { mode: 'edit', taskId: t.id }">Editar</v-btn>
    </div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <span class="text-h6 font-weight-bold">{{ t.id }}</span>
      <span class="text-h6">{{ t.title }}</span>
      <v-chip :color="TASK_STATUS_META[t.status].color" variant="tonal">{{ TASK_STATUS_META[t.status].label }}</v-chip>
      <v-chip :color="PRIORITY_META[t.priority].color" variant="tonal">{{ PRIORITY_META[t.priority].label }}</v-chip>
      <v-chip v-if="blockedByDep" color="warning" variant="tonal" prepend-icon="mdi-lock-outline">bloqueada por dependência</v-chip>
      <v-chip v-if="!isSpecified(t)" color="grey" variant="outlined" prepend-icon="mdi-information-outline">não pronta: faltam critérios/referências</v-chip>
    </div>
    <v-alert v-if="external" type="warning" variant="tonal" density="compact" class="mb-3">
      O arquivo <span class="sb-mono">{{ t.tasksPath }}</span> foi alterado externamente. Recarregue antes de editar.
    </v-alert>
    <v-alert v-if="t.status === 'blocked'" type="error" variant="tonal" density="compact" class="mb-3">
      Motivo do bloqueio: {{ t.blockedReason || 'não informado' }}
    </v-alert>

    <v-tabs v-model="tab" density="compact" color="primary">
      <v-tab value="desc">Descrição</v-tab>
      <v-tab value="req">Requisitos</v-tab>
      <v-tab value="acc">Critérios de aceite ({{ t.acceptance.length }})</v-tab>
      <v-tab value="files">Arquivos ({{ t.files.length }})</v-tab>
      <v-tab value="deps">Dependências ({{ t.dependsOn.length }})</v-tab>
    </v-tabs>
    <v-divider class="mb-3" />
    <v-window v-model="tab">
      <v-window-item value="desc">
        <MarkdownPreview v-if="t.description" :source="t.description" />
        <div v-else class="text-medium-emphasis text-body-2">Sem descrição adicional.</div>
        <div v-if="t.notes" class="mt-2"><strong>Notas:</strong> {{ t.notes }}</div>
        <div v-if="t.parallelGroup" class="text-caption mt-2">Grupo paralelo (sugestão): {{ t.parallelGroup }}</div>
      </v-window-item>
      <v-window-item value="req">
        <div v-if="!t.specRefs.length" class="text-medium-emphasis text-body-2">Nenhum requisito referenciado.</div>
        <ul class="pl-4">
          <li v-for="r in t.specRefs" :key="r">
            <strong>{{ r }}</strong> — {{ spec?.requirements.find((x) => x.id === r)?.text ?? 'requisito não encontrado na Spec' }}
          </li>
        </ul>
      </v-window-item>
      <v-window-item value="acc">
        <div v-if="!t.acceptance.length" class="text-warning text-body-2">Sem critérios de aceite.</div>
        <v-list density="compact" bg-color="transparent">
          <v-list-item v-for="a in t.acceptance" :key="a" prepend-icon="mdi-circle-small" :title="a" />
        </v-list>
      </v-window-item>
      <v-window-item value="files">
        <div v-if="!t.files.length" class="text-medium-emphasis text-body-2">Nenhum arquivo previsto.</div>
        <div v-for="f in t.files" :key="f" class="sb-mono py-1"><v-icon icon="mdi-file-outline" size="16" class="mr-1" />{{ f }}</div>
      </v-window-item>
      <v-window-item value="deps">
        <div v-if="!t.dependsOn.length" class="text-medium-emphasis text-body-2">Sem dependências.</div>
        <div v-for="d in t.dependsOn" :key="d" class="py-1 d-flex align-center ga-2">
          <v-icon
            :icon="project.taskById.get(d)?.status === 'done' ? 'mdi-check-circle' : 'mdi-clock-outline'"
            :color="project.taskById.get(d)?.status === 'done' ? 'success' : 'warning'"
            size="18"
          />
          <a v-if="project.taskById.get(d)" href="#" @click.prevent="ui.selectedTaskId = d">{{ d }} — {{ project.taskById.get(d)?.title }}</a>
          <span v-else class="text-error">{{ d }} (inexistente)</span>
        </div>
      </v-window-item>
    </v-window>
  </div>
  <div v-else class="sb-panel pa-6 text-center text-medium-emphasis">
    <v-icon icon="mdi-cursor-default-click-outline" size="32" class="mb-2" />
    <div>Selecione uma tarefa para ver os detalhes.</div>
  </div>
</template>
