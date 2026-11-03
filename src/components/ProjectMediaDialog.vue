<script setup lang="ts">
import { ref, watch } from 'vue'
import { optimizeImage } from '@/infrastructure/image-optimizer'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const tab = ref<'logo' | 'cover'>('cover')
const logoInput = ref(ui.currentLogo || '')
const coverInput = ref(ui.currentCover || '')
const processing = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => ui.mediaDialog,
  (open) => {
    if (open) {
      logoInput.value = ui.currentLogo || ''
      coverInput.value = ui.currentCover || ''
      errorMessage.value = null
    }
  },
)

async function onLogoFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  processing.value = true
  errorMessage.value = null
  try {
    // Redimensiona o logo para max 256x256 com qualidade alta
    const optimized = await optimizeImage(file, 256, 256, 0.88)
    logoInput.value = optimized
  } catch (err) {
    errorMessage.value = `Erro ao processar imagem do logo: ${(err as Error).message}`
  } finally {
    processing.value = false
  }
}

async function onCoverFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  processing.value = true
  errorMessage.value = null
  try {
    // Redimensiona a capa para max 1280x480 com qualidade otimizada
    const optimized = await optimizeImage(file, 1280, 480, 0.85)
    coverInput.value = optimized
  } catch (err) {
    errorMessage.value = `Erro ao processar imagem da capa: ${(err as Error).message}`
  } finally {
    processing.value = false
  }
}

async function save() {
  processing.value = true
  errorMessage.value = null
  try {
    let finalLogo = logoInput.value.trim() || null
    let finalCover = coverInput.value.trim() || null

    // Se o usuário colou uma string data:image muito grande diretamente, otimiza antes de salvar
    if (finalLogo && finalLogo.startsWith('data:image') && finalLogo.length > 300000) {
      finalLogo = await optimizeImage(finalLogo, 256, 256, 0.88)
    }
    if (finalCover && finalCover.startsWith('data:image') && finalCover.length > 500000) {
      finalCover = await optimizeImage(finalCover, 1280, 480, 0.85)
    }

    await ui.setProjectLogo(finalLogo)
    await ui.setProjectCover(finalCover)
    ui.mediaDialog = false
  } catch (err) {
    errorMessage.value = `Erro ao salvar: ${(err as Error).message}`
  } finally {
    processing.value = false
  }
}

async function removeLogo() {
  logoInput.value = ''
  await ui.setProjectLogo(null)
}

async function removeCover() {
  coverInput.value = ''
  await ui.setProjectCover(null)
}
</script>

<template>
  <v-dialog v-model="ui.mediaDialog" max-width="580" scrollable>
    <v-card class="sb-panel">
      <v-card-title class="d-flex align-center justify-space-between pt-4 px-4 pb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-image-edit-outline" color="primary" />
          <span class="text-h6 font-weight-bold">Personalizar Logo e Capa</span>
        </div>
        <v-btn icon size="small" variant="text" aria-label="Fechar" @click="ui.mediaDialog = false">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>

      <v-tabs v-model="tab" color="primary" class="px-4">
        <v-tab value="cover"><v-icon icon="mdi-panorama-outline" start />Capa do Projeto</v-tab>
        <v-tab value="logo"><v-icon icon="mdi-shape-square-rounded-plus" start />Logo / Ícone</v-tab>
      </v-tabs>
      <v-divider />

      <v-card-text class="pa-4">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
          closable
          @click:close="errorMessage = null"
        >
          {{ errorMessage }}
        </v-alert>

        <v-window v-model="tab">
          <!-- ABA DA CAPA -->
          <v-window-item value="cover">
            <p class="text-body-2 text-medium-emphasis mb-3">
              Defina a imagem panorâmica de capa exibida no topo do projeto.
            </p>

            <div class="mb-4">
              <div class="text-caption font-weight-bold mb-1">Pré-visualização da Capa:</div>
              <div
                class="sb-panel d-flex align-center justify-center overflow-hidden position-relative"
                style="height: 140px; background-size: cover; background-position: center;"
                :style="coverInput ? { backgroundImage: `url(${coverInput})` } : {}"
              >
                <div v-if="!coverInput" class="text-center text-medium-emphasis">
                  <v-icon icon="mdi-image-outline" size="32" class="d-block mx-auto mb-1" />
                  <span class="text-caption">Nenhuma capa definida</span>
                </div>
                <v-btn
                  v-if="coverInput"
                  icon
                  size="small"
                  color="error"
                  variant="flat"
                  class="position-absolute"
                  style="top: 8px; right: 8px;"
                  aria-label="Remover capa"
                  @click="coverInput = ''"
                >
                  <v-icon icon="mdi-delete" size="18" />
                </v-btn>
              </div>
            </div>

            <div class="d-flex align-center ga-2 mb-3">
              <v-btn
                variant="tonal"
                color="primary"
                prepend-icon="mdi-upload"
                :loading="processing"
                @click="($refs.coverFileInput as HTMLInputElement)?.click()"
              >
                Enviar arquivo de imagem
              </v-btn>
              <input
                ref="coverFileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onCoverFile"
              />
              <v-btn v-if="ui.currentCover" variant="text" color="error" size="small" @click="removeCover">
                Limpar atual
              </v-btn>
            </div>

            <v-text-field
              v-model="coverInput"
              label="Ou cole a URL da imagem da capa"
              placeholder="https://exemplo.com/imagem.png ou /caminho/local.jpg"
              clearable
              hint="Salvo no localStorage por projeto"
              persistent-hint
            />
          </v-window-item>

          <!-- ABA DO LOGO -->
          <v-window-item value="logo">
            <p class="text-body-2 text-medium-emphasis mb-3">
              Defina o ícone ou avatar do projeto exibido no topo e na barra lateral.
            </p>

            <div class="mb-4 d-flex align-center ga-4">
              <div>
                <div class="text-caption font-weight-bold mb-1">Prévia:</div>
                <v-avatar size="64" rounded="lg" color="surface-variant" class="border">
                  <v-img v-if="logoInput" :src="logoInput" cover />
                  <v-icon v-else icon="mdi-view-dashboard-variant" size="32" color="primary" />
                </v-avatar>
              </div>
              <div class="flex-grow-1">
                <v-btn
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-upload"
                  class="mb-2"
                  :loading="processing"
                  @click="($refs.logoFileInput as HTMLInputElement)?.click()"
                >
                  Carregar imagem do logo
                </v-btn>
                <input
                  ref="logoFileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="onLogoFile"
                />
                <div v-if="logoInput">
                  <v-btn variant="text" color="error" size="small" @click="removeLogo">
                    Remover logo
                  </v-btn>
                </div>
              </div>
            </div>

            <v-text-field
              v-model="logoInput"
              label="Ou cole a URL da logo / ícone"
              placeholder="https://exemplo.com/logo.png"
              clearable
              hint="Salvo no localStorage por projeto"
              persistent-hint
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="processing" @click="ui.mediaDialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="processing" @click="save">Salvar alterações</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
