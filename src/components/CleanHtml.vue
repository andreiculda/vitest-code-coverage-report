<template>
    <component
        :is="tag"
        v-bind="$attrs"
        @click="emit('click', $event)"
    >
        <span
            class="sanitized-value"
            v-html="DOMPurify.sanitize(cleanHtml(html || ''))"
        />
    </component>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
const {
    html = '',
    tag = 'div',
} = defineProps<{
    html?: string,
    tag?: string,
}>()
const emit = defineEmits<{
    click: [value: MouseEvent],
}>()

function cleanHtml (html: string) {
    return html
        .replaceAll('&amp;amp;', '&amp;')
        .replaceAll('&nbsp;', ' ')
}
</script>
