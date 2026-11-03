<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { PRIORITY_META, SPEC_STATUS_META, TASK_STATUS_META } from '@/app/labels'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ id: string }>()
const project = useProjectStore()
const ui = useUiStore()
const tab = ref('overview')
const specEditor = ref<InstanceType<typeof MarkdownEditor> | null>(null)
const planEditor = ref<InstanceType<typeof MarkdownEditor> | null>(null)

const spec = computed(() => project.model.specs.find((s) => s.id === props.id))
const tasks = computed(() => project.model.tasks.filter((t) => t.specId === props.id))
const files = computed(() => [spec.value?.specPath, spec.value?.planPath, spec.value?.tasksPath].filter((p): p is string => !!p))
const issues = computed(() => project.model.issues.filter((i) => i.ref === props.id || (i.file && files.value.includes(i.file))))
const depTasks = computed(() => tasks.value.filter((t) => t.dependsOn.length))

onBeforeRouteLeave(() => {
  if (specEditor.value?.dirty || planEditor.value?.dirty) return window.confirm('Há alterações não salvas. Sair mesmo assim?')
  return true
})
</script>

<template>
  <div v-if="!spec" class="sb-panel pa-8 text-center">
    <div class="text-h6">Spec não encontrada</div>
    <v-btn class="mt-3" to="/specs" color="primary">Voltar</v-btn>
  </div>
  <template v-else>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn icon variant="text" to="/specs" aria-label="Voltar"><v-icon icon="mdi-arrow-left" /></v-btn>
      <span class="text-h5 font-weight-bold">{{ spec.id }}</span>
      <span class="text-h5">{{ spec.title }}</span>
      <v-chip :color="SPEC_STATUS_META[spec.status].color" variant="tonal">{{ SPEC_STATUS_META[spec.status].label }}</v-chip>
      <v-chip :color="PRIORITY_META[spec.priority].color" variant="tonal">{{ PRIORITY_META[spec.priority].label }}</v-chip>
    </div>
    <v-tabs v-model="tab" color="primary" show-arrows>
      <v-tab value="overview">Visão geral</v-tab>
      <v-tab value="spec">Especificação</v-tab>
      <v-tab value="plan">Plano</v-tab>
      <v-tab value="tasks">Tarefas ({{ tasks.length }})</v-tab>
      <v-tab value="deps">Dependências</v-tab>
      <v-tab value="files">Arquivos</v-tab>
      <v-tab value="history">Histórico</v-tab>
    </v-tabs>
    <v-divider class="mb-4" />
    <v-window v-model="tab" :touch="false">
      <v-window-item value="overview">
        <v-row>
          <v-col cols="12" md="7">
            <div class="sb-panel pa-4">
              <div class="text-subtitle-2 mb-1">Objetivo</div>
              <MarkdownPreview v-if="spec.objective" :source="spec.objective" />
              <div v-else class="text-warning">Spec sem objetivo definido.</div>
              <div class="text-subtitle-2 mt-4 mb-1">Requisitos</div>
              <div v-if="!spec.requirements.length" class="text-warning text-body-2">Nenhum requisito.</div>
              <ul class="pl-4"><li v-for="r in spec.requirements" :key="r.id"><strong>{{ r.id }}</strong>: {{ r.text }}</li></ul>
            </div>
          </v-col>
          <v-col cols="12" md="5">
            <div class="sb-panel pa-4">
              <div class="text-subtitle-2 mb-1">Critérios de aceite</div>
              <div v-if="!spec.acceptanceCriteria.length" class="text-warning text-body-2">Nenhum critério.</div>
              <div v-for="a in spec.acceptanceCriteria" :key="a.text" class="d-flex align-center ga-2">
                <v-icon :icon="a.checked ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" size="18" :color="a.checked ? 'success' : undefined" />
                <span class="text-body-2">{{ a.text }}</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-window-item>
      <v-window-item value="spec"><MarkdownEditor ref="specEditor" :path="spec.specPath" label="spec.md" /></v-window-item>
      <v-window-item value="plan">
        <MarkdownEditor v-if="spec.planPath" ref="planEditor" :path="spec.planPath" label="plan.md" />
        <div v-else class="text-medium-emphasis">Esta Spec não possui plan.md.</div>
      </v-window-item>
      <v-window-item value="tasks">
        <div class="d-flex mb-3"><v-spacer /><v-btn color="primary" prepend-icon="mdi-plus" @click="ui.taskEditor = { mode: 'create', specId: spec.id }">Nova tarefa</v-btn></div>
        <div v-if="!tasks.length" class="text-medium-emphasis">Sem tarefas.</div>
        <v-list class="sb-panel" density="compact" bg-color="transparent">
          <v-list-item v-for="t in tasks" :key="t.id" :title="`${t.id} — ${t.title}`" @click="ui.selectedTaskId = t.id">
            <template #append>
              <v-chip :color="TASK_STATUS_META[t.status].color" variant="tonal">{{ TASK_STATUS_META[t.status].label }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>
      <v-window-item value="deps">
        <div v-if="!depTasks.length" class="text-medium-emphasis">Nenhuma dependência declarada nesta Spec.</div>
        <div v-for="t in depTasks" :key="t.id" class="py-1">
          <strong>{{ t.id }}</strong> depende de
          <v-chip v-for="d in t.dependsOn" :key="d" class="ml-1" :color="project.taskById.get(d) ? (project.taskById.get(d)?.status === 'done' ? 'success' : 'warning') : 'error'" variant="tonal">{{ d }}</v-chip>
        </div>
        <router-link to="/dependencies" class="d-block mt-3">Ver visão completa de dependências</router-link>
      </v-window-item>
      <v-window-item value="files">
        <div v-for="f in files" :key="f" class="sb-mono py-1"><v-icon icon="mdi-file-document-outline" size="16" class="mr-1" />{{ f }}</div>
        <div v-if="issues.length" class="mt-4">
          <div class="text-subtitle-2 mb-1">Problemas</div>
          <v-alert v-for="(i, k) in issues" :key="k" :type="i.severity" variant="tonal" density="compact" class="mb-1">{{ i.message }} <span v-if="i.file" class="sb-mono">({{ i.file }}{{ i.line ? ':' + i.line : '' }})</span></v-alert>
        </div>
      </v-window-item>
      <v-window-item value="history">
        <div class="text-medium-emphasis">
          O histórico é mantido pelo Git do repositório. Alterações locais pendentes:
          <span v-if="project.git.available">{{ project.git.changed?.length ?? 0 }}</span><span v-else>Git indisponível</span>.
        </div>
        <ul v-if="project.git.changed?.length" class="sb-mono pl-4 mt-2"><li v-for="c in project.git.changed" :key="c">{{ c }}</li></ul>
      </v-window-item>
    </v-window>
  </template>
</template>
