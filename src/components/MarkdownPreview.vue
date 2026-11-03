<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{ source: string }>()

/** Markdown sempre sanitizado; links externos abrem sem referrer e nunca são seguidos automaticamente. */
const html = computed(() => {
  const raw = marked.parse(props.source ?? '', { async: false, gfm: true }) as string
  return DOMPurify.sanitize(raw, { FORBID_TAGS: ['style', 'form', 'input', 'iframe'], FORBID_ATTR: ['style', 'onerror', 'onclick'] })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="sb-md text-body-2" v-html="html" />
</template>
