import { onMounted, onUnmounted } from 'vue'

export interface KeyboardHandlers {
    onSearch?: () => void
    onNextFile?: () => void
    onPrevFile?: () => void
    onEscape?: () => void
    onToggleTheme?: () => void
    onOpenHelp?: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (target.isContentEditable) return true
    return false
}

export function useKeyboard(handlers: KeyboardHandlers): void {
    function onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            handlers.onEscape?.()
            return
        }
        if (isTypingTarget(event.target)) return
        if (event.ctrlKey || event.metaKey || event.altKey) return

        switch (event.key) {
            case '/': {
                event.preventDefault()
                handlers.onSearch?.()
                break
            }
            case 'j': {
                event.preventDefault()
                handlers.onNextFile?.()
                break
            }
            case 'k': {
                event.preventDefault()
                handlers.onPrevFile?.()
                break
            }
            case 't': {
                event.preventDefault()
                handlers.onToggleTheme?.()
                break
            }
            case '?': {
                event.preventDefault()
                handlers.onOpenHelp?.()
                break
            }
        }
    }

    onMounted(() => window.addEventListener('keydown', onKeyDown))
    onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
