<template>
    <template v-if="nodeMatches(node)">
        <div
            :class="[
                'flex items-center gap-1.5 cursor-pointer py-0.5 rounded px-1 pr-2 transition-colors',
                isSelected
                    ? 'bg-brand-500/15 text-brand-700 dark:text-brand-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
            :style="{ paddingLeft: `${indent + 4}px` }"
            @click="onRowClick"
        >
            <span class="w-4 flex-shrink-0 inline-flex items-center justify-center">
                {{ !node.isFile ? (expanded ? '▾' : '▸') : '' }}
            </span>
            <span
                :class="[
                    'flex-shrink-0 inline-block w-4',
                    node.isFile ? 'text-slate-400 dark:text-slate-500' : 'text-brand-500',
                ]"
            >
                {{ node.isFile ? '📄' : '📁' }}
            </span>
            <span
                :class="['truncate flex-1 min-w-0', node.isFile ? '' : 'font-semibold']"
                :title="node.fullPath"
            >
                {{ node.name }}
            </span>
            <span
                :class="[
                    'tabular-nums text-[11px] font-semibold flex-shrink-0',
                    colorFor(coveragePercentage),
                ]"
            >
                {{ coveragePercentage.toFixed(1) }}%
            </span>
            <span class="tabular-nums text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 w-20 text-right">
                {{ aggLine(node) }}
            </span>
        </div>

        <template v-if="!node.isFile && expanded">
            <TreeRow
                v-for="child in node.children"
                :key="child.fullPath"
                :node="child"
                :depth="depth + 1"
                :selected-path="selectedPath"
                :is-expanded="isExpanded"
                :node-matches="nodeMatches"
                :coverage-percentage-for="coveragePercentageFor"
                :agg-line="aggLine"
                :color-for="colorFor"
                @toggle="emit('toggle', $event)"
                @select="emit('select', $event)"
            />
        </template>
    </template>
</template>

<script setup lang="ts">
import type { TreeNode } from '@/types'
import { computed } from 'vue'

const {
    node,
    depth,
    selectedPath,
    isExpanded,
    nodeMatches,
    coveragePercentageFor,
    aggLine,
    colorFor,
} = defineProps<{
    node: TreeNode
    depth: number
    selectedPath: string | null
    isExpanded: (node: TreeNode) => boolean
    nodeMatches: (node: TreeNode) => boolean
    coveragePercentageFor: (node: TreeNode) => number
    aggLine: (node: TreeNode) => string
    colorFor: (coveragePercentage: number) => string
}>()
const emit = defineEmits<{
    toggle: [node: TreeNode]
    select: [node: TreeNode]
}>()

const expanded = computed(() => isExpanded(node))
const coveragePercentage = computed(() => coveragePercentageFor(node))
const isSelected = computed(() => node.isFile && selectedPath === node.fullPath)
const indent = computed(() => depth * 14)

function onRowClick (): void {
    if (node.isFile) emit('select', node)
    else emit('toggle', node)
}
</script>
