import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark'

function detectInitial(): Theme {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('cov-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(detectInitial())

watchEffect(() => {
    const root = document.documentElement
    if (theme.value === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    window.localStorage.setItem('cov-theme', theme.value)
})

export function useTheme() {
    function toggle(): void {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }
    return { theme, toggle }
}
