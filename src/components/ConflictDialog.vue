<script setup lang="ts">
import { computed, ref } from 'vue'
import { diffLines } from '@/domain/diff'
import { useProjectStore } from '@/stores/project'

const project = useProjectStore()
const confirmOverwrite = ref(false)
const show = computed({
  get: () => !!project.conflict,
  set: (v: boolean) => {
    if (!v) project.conflict = null
  },
})
const diff = computed(() => (project.conflict ? diffLines(project.conflict.theirs ?? '', project.conflict.mine) : []))
const changedOnly = computed(() => diff.value.filter((l) => l.type !== 'same'))

async function overwrite() {
  confirmOverwrite.value = false
  await project.resolveOverwrite()
}
</script>

<template>
  <v-dialog v-model="show" max-width="860" persistent>
    <v-card v-if="project.conflict">
      <v-card-title class="d-flex align-center ga-2 pt-4">
        <v-icon icon="mdi-alert" color="warning" /> Conflito de gravação
      </v-card-title>
      <v-card-text>
        <p class="mb-3">
          <span class="sb-mono">{{ project.conflict.path }}</span> foi alterado fora do SpecBoard desde a última leitura. Nada foi gravado.
        </p>
        <div class="text-caption text-medium-emphasis mb-1">
          Diferenças (<span class="text-error">− disco atual</span> / <span class="text-success">+ sua alteração</span>):
        </div>
        <div class="sb-panel pa-2 sb-mono" style="max-height: 320px; overflow: auto" aria-label="Diff">
          <div v-if="!changedOnly.length" class="text-medium-emphasis">Sem diferenças textuais.</div>
          <div
            v-for="(l, i) in changedOnly"
            :key="i"
            :class="l.type === 'add' ? 'text-success' : 'text-error'"
            style="white-space: pre-wrap"
          >{{ l.type === 'add' ? '+ ' : '− ' }}{{ l.text }}</div>
        </div>
      </v-card-text>
      <v-card-actions class="flex-wrap ga-2 px-4 pb-4">
        <v-btn variant="text" @click="project.resolveDiscard()">Descartar minha alteração e recarregar</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="project.conflict.theirs === null"
          @click="project.resolveReapply()"
        >
          Reaplicar sobre a versão do disco
        </v-btn>
        <v-btn color="error" variant="tonal" @click="confirmOverwrite = true">Sobrescrever…</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="confirmOverwrite" max-width="420">
    <v-card title="Sobrescrever alterações externas?">
      <v-card-text>As alterações feitas fora do SpecBoard neste arquivo serão perdidas.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmOverwrite = false">Cancelar</v-btn>
        <v-btn color="error" @click="overwrite">Sobrescrever</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
