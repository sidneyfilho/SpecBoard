<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{ path: string; label: string }>()
const project = useProjectStore()

const saved = computed(() => project.model.files[props.path]?.content ?? '')
const text = ref(saved.value)
const view = ref<'split' | 'edit' | 'preview'>('split')
const saving = ref(false)
const dirty = computed(() => text.value !== saved.value)

watch(
  () => [props.path, saved.value] as const,
  ([, content], [oldPath]) => {
    // Só substitui o texto se não houver edição pendente ou se mudou de arquivo.
    if (props.path !== oldPath || !dirty.value || content === text.value) text.value = content
  },
)

async function save() {
  saving.value = true
  await project.saveDocument(props.path, text.value)
  saving.value = false
}
function discard() {
  text.value = saved.value
}
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (dirty.value) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
defineExpose({ dirty })
</script>

<template>
  <div>
    <div class="d-flex align-center ga-2 mb-2 flex-wrap">
      <span class="text-subtitle-2">{{ label }}</span>
      <span class="sb-mono text-medium-emphasis">{{ path }}</span>
      <v-chip v-if="dirty" color="warning" variant="tonal">alterações não salvas</v-chip>
      <v-spacer />
      <v-btn-toggle v-model="view" density="compact" mandatory variant="outlined" divided>
        <v-btn value="edit" size="small">Editar</v-btn>
        <v-btn value="split" size="small">Dividido</v-btn>
        <v-btn value="preview" size="small">Preview</v-btn>
      </v-btn-toggle>
      <v-btn variant="text" :disabled="!dirty" @click="discard">Descartar</v-btn>
      <v-btn color="primary" :loading="saving" :disabled="!dirty || project.isDemo" @click="save">Salvar</v-btn>
    </div>
    <v-alert v-if="project.isDemo" type="info" variant="tonal" density="compact" class="mb-2">Demonstração: edição desabilitada.</v-alert>
    <v-row dense>
      <v-col v-if="view !== 'preview'" :cols="view === 'split' ? 6 : 12">
        <v-textarea v-model="text" :aria-label="label" rows="20" auto-grow class="sb-mono" :readonly="project.isDemo" />
      </v-col>
      <v-col v-if="view !== 'edit'" :cols="view === 'split' ? 6 : 12">
        <div class="sb-panel pa-3" style="min-height: 200px"><MarkdownPreview :source="text" /></div>
      </v-col>
    </v-row>
  </div>
</template>
