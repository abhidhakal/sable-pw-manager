import { getPasswordStrength } from './passwordGenerator'
import type { VaultItem } from '@/types/vault'

export interface PasswordHealthReport {
  totalItems: number
  weakPasswords: (VaultItem & { id: string })[]
  reusedPasswords: Map<string, (VaultItem & { id: string })[]>
  oldPasswords: (VaultItem & { id: string })[]
  healthScore: number
}

const OLD_PASSWORD_DAYS = 90

/**
 * Analyze vault items for password health issues.
 * All analysis happens client-side on already-decrypted data.
 */
export function analyzePasswordHealth(items: (VaultItem & { id: string })[]): PasswordHealthReport {
  const weakPasswords: (VaultItem & { id: string })[] = []
  const reusedMap = new Map<string, (VaultItem & { id: string })[]>()
  const oldPasswords: (VaultItem & { id: string })[] = []
  const now = Date.now()
  const oldThreshold = OLD_PASSWORD_DAYS * 24 * 60 * 60 * 1000

  for (const item of items) {
    // Check weak passwords
    const strength = getPasswordStrength(item.password)
    if (strength.score < 3) {
      weakPasswords.push(item)
    }

    // Track reused passwords
    const existing = reusedMap.get(item.password)
    if (existing) {
      existing.push(item)
    } else {
      reusedMap.set(item.password, [item])
    }

    // Check old passwords
    if (item.updatedAt) {
      const updatedMs = item.updatedAt.toMillis ? item.updatedAt.toMillis() : (item.updatedAt as any)?.seconds * 1000
      if (updatedMs && now - updatedMs > oldThreshold) {
        oldPasswords.push(item)
      }
    } else if (item.createdAt) {
      const createdMs = item.createdAt.toMillis ? item.createdAt.toMillis() : (item.createdAt as any)?.seconds * 1000
      if (createdMs && now - createdMs > oldThreshold) {
        oldPasswords.push(item)
      }
    }
  }

  // Filter reused to only groups with 2+ items
  const reusedPasswords = new Map<string, (VaultItem & { id: string })[]>()
  for (const [pw, group] of reusedMap) {
    if (group.length > 1) {
      reusedPasswords.set(pw, group)
    }
  }

  // Calculate health score
  const totalItems = items.length
  if (totalItems === 0) {
    return { totalItems: 0, weakPasswords: [], reusedPasswords: new Map(), oldPasswords: [], healthScore: 100 }
  }

  const issueCount = new Set([
    ...weakPasswords.map((i) => i.id),
    ...Array.from(reusedPasswords.values()).flat().map((i) => i.id),
    ...oldPasswords.map((i) => i.id),
  ]).size

  const healthScore = Math.round(((totalItems - issueCount) / totalItems) * 100)

  return {
    totalItems,
    weakPasswords,
    reusedPasswords,
    oldPasswords,
    healthScore: Math.max(0, healthScore),
  }
}

/**
 * Check a password against HaveIBeenPwned using k-anonymity.
 * Only sends the first 5 characters of the SHA-1 hash.
 */
export async function checkPwnedPassword(password: string): Promise<number> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    const prefix = hashHex.slice(0, 5)
    const suffix = hashHex.slice(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    if (!response.ok) return 0

    const text = await response.text()
    const lines = text.split('\n')

    for (const line of lines) {
      const [hash, count] = line.split(':')
      if (hash.trim() === suffix) {
        return parseInt(count.trim(), 10)
      }
    }

    return 0
  } catch {
    return 0
  }
}
