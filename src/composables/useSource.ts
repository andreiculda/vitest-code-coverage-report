const cache = new Map<string, Promise<string>>()

export function useSource() {
    function get(relOrAbsPath: string): Promise<string> {
        const existing = cache.get(relOrAbsPath)
        if (existing) return existing
        const promise = (async () => {
            const res = await fetch(`/__cov/source?path=${encodeURIComponent(relOrAbsPath)}`)
            if (!res.ok) {
                const body = await res.text().catch(() => '')
                throw new Error(`Failed to load source (${res.status}): ${body}`)
            }
            return res.text()
        })()
        cache.set(relOrAbsPath, promise)
        return promise
    }
    function clear(): void {
        cache.clear()
    }
    return { get, clear }
}
