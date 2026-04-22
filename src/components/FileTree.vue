<template>
    <div class="font-mono text-[13px] select-none">
        <TreeRow
            v-for="child in visibleTree.children"
            :key="child.fullPath"
            :node="child"
            :depth="0"
            :selected-path="selectedPath"
            :is-expanded="isExpanded"
            :node-matches="nodeMatches"
            :coverage-percentage-for="coveragePercentageFor"
            :agg-line="aggLine"
            :color-for="colorFor"
            @toggle="toggle"
            @select="onFileClick"
        />
    </div>
</template>
<script setup lang="ts">
import { useThresholds } from '@/composables/useThresholds'
import type { FileStats, MetricKey, TreeNode } from '@/types'
import { computed, ref } from 'vue'
import TreeRow from './TreeRow.vue'

const {
    root,
    selectedPath,
    metric,
    query,
} = defineProps<{
    root: TreeNode
    selectedPath: string | null
    metric: MetricKey
    query: string
}>()
const emit = defineEmits<{ select: [file: FileStats] }>()

const { colorFor } = useThresholds()

const manuallyExpanded = ref<Set<string>>(new Set(['']))
const manuallyCollapsed = ref<Set<string>>(new Set())

const normalizedQuery = computed(() => query.trim().toLowerCase())

function nodeMatches (node: TreeNode): boolean {
    if (!normalizedQuery.value) return true
    if (node.isFile) {
        return node.fullPath.toLowerCase().includes(normalizedQuery.value)
    }
    return node.children.some(nodeMatches)
}

const visibleTree = computed(() => root)

function isExpanded (node: TreeNode): boolean {
    if (node.isFile) return false
    if (manuallyCollapsed.value.has(node.fullPath)) return false
    if (manuallyExpanded.value.has(node.fullPath)) return true
    if (normalizedQuery.value) return true
    return node.fullPath === '' || node.fullPath.split('/').length <= 1
}

function toggle (node: TreeNode): void {
    if (node.isFile) return
    const wasExpanded = isExpanded(node)
    if (wasExpanded) {
        manuallyExpanded.value.delete(node.fullPath)
        manuallyCollapsed.value.add(node.fullPath)
    } else {
        manuallyCollapsed.value.delete(node.fullPath)
        manuallyExpanded.value.add(node.fullPath)
    }
    manuallyExpanded.value = new Set(manuallyExpanded.value)
    manuallyCollapsed.value = new Set(manuallyCollapsed.value)
}

function onFileClick (node: TreeNode): void {
    if (node.isFile && node.stats) emit('select', node.stats)
}

function coveragePercentageFor (node: TreeNode): number {
    return node.aggregated[metric].coveragePercentage
}

function aggLine (node: TreeNode): string {
    const m = node.aggregated[metric]
    return `${m.covered}/${m.total}`
}
</script>
