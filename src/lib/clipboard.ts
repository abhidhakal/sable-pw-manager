const CLEAR_DELAY_MS = 30_000

let clearTimeoutId: ReturnType<typeof setTimeout> | null = null
let lastCopiedText: string | null = null

/** Clear clipboard, verifying we're clearing our own copied text */
async function clearOurClipboard(): Promise<void> {
  if (!lastCopiedText) return
  try {
    // Only clear if the clipboard still contains our text
    const current = await navigator.clipboard.readText()
    if (current === lastCopiedText) {
      await navigator.clipboard.writeText('')
    }
  } catch {
    // Clipboard read/write may fail if tab is not focused
  }
  lastCopiedText = null
}

/**
 * Copy text to clipboard and automatically clear it after 30 seconds.
 * Also clears on tab visibility change and page unload.
 * Returns true if copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)

    // Clear any pending clear timeout
    if (clearTimeoutId !== null) {
      clearTimeout(clearTimeoutId)
    }

    lastCopiedText = text

    // Schedule clipboard clear
    clearTimeoutId = setTimeout(async () => {
      await clearOurClipboard()
      clearTimeoutId = null
    }, CLEAR_DELAY_MS)

    return true
  } catch {
    return false
  }
}

/** Cancel any pending clipboard clear */
export function cancelClipboardClear(): void {
  if (clearTimeoutId !== null) {
    clearTimeout(clearTimeoutId)
    clearTimeoutId = null
  }
}

/** Immediately clear the clipboard if we have a pending copy */
export async function forceClearClipboard(): Promise<void> {
  if (clearTimeoutId !== null) {
    clearTimeout(clearTimeoutId)
    clearTimeoutId = null
  }
  await clearOurClipboard()
}

// Clear clipboard when tab becomes hidden (user switched tabs)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    forceClearClipboard()
  }
})

// Clear clipboard when page is unloading
window.addEventListener('beforeunload', () => {
  // Synchronous clear attempt — best-effort
  if (lastCopiedText) {
    navigator.clipboard.writeText('').catch(() => {})
    lastCopiedText = null
  }
  if (clearTimeoutId !== null) {
    clearTimeout(clearTimeoutId)
    clearTimeoutId = null
  }
})
