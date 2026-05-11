import * as Clipboard from 'expo-clipboard'
import { AppState } from 'react-native'

const CLEAR_DELAY_MS = 30_000

let clearTimeoutId: ReturnType<typeof setTimeout> | null = null
let lastCopiedText: string | null = null

/** Clear clipboard, verifying we're clearing our own copied text */
async function clearOurClipboard(): Promise<void> {
  if (!lastCopiedText) return
  try {
    const current = await Clipboard.getStringAsync()
    if (current === lastCopiedText) {
      await Clipboard.setStringAsync('')
    }
  } catch {
    // Ignore errors
  }
  lastCopiedText = null
}

/**
 * Copy text to clipboard and automatically clear it after 30 seconds.
 * Returns true if copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text)

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

// Clear clipboard when app goes to background
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background') {
    forceClearClipboard()
  }
})
